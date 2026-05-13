-- =============================================================================
-- Membership offerings: commercial gym products + term pricing + entitlement fanout
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. athlete_subscription constraints: athlete_track must point at a library
-- ---------------------------------------------------------------------------
alter table public.athlete_subscription
  drop constraint if exists athlete_subscription_athlete_track_requires_library_check;

alter table public.athlete_subscription
  add constraint athlete_subscription_athlete_track_requires_library_check
  check (
    subscription_scope <> 'athlete_track'
    or program_library_id is not null
  );

create unique index if not exists athlete_subscription_active_track_unique_idx
  on public.athlete_subscription (contact_id, gym_id, program_library_id)
  where subscription_scope = 'athlete_track'
    and status in ('active', 'trial', 'paused');

comment on constraint athlete_subscription_athlete_track_requires_library_check on public.athlete_subscription is
  'Athlete track entitlements must always target a specific program_library. Gym-wide null libraries are reserved for staff scopes.';

-- ---------------------------------------------------------------------------
-- 2. Commercial offering layer
-- ---------------------------------------------------------------------------
create table if not exists public.membership_offering (
  id                    uuid primary key default gen_random_uuid (),
  gym_id                uuid not null references public.gym (id) on delete cascade,
  name                  text not null,
  description           text,
  is_active             boolean not null default true,
  created_by_contact_id uuid references public.contact (id) on delete set null,
  created_at            timestamptz not null default now (),
  updated_at            timestamptz not null default now (),
  unique (gym_id, name)
);

create index if not exists membership_offering_gym_id_idx
  on public.membership_offering (gym_id);

create trigger membership_offering_set_updated_at
  before update on public.membership_offering
  for each row execute procedure public.set_updated_at ();

comment on table public.membership_offering is
  'Sellable athlete-facing gym product, e.g. Group Class, Open Gym, 24/7 Access.';

create table if not exists public.membership_offering_term (
  id                     uuid primary key default gen_random_uuid (),
  membership_offering_id uuid not null references public.membership_offering (id) on delete cascade,
  term_months            smallint not null,
  price_cents            integer not null,
  currency               text not null default 'USD',
  billing_type           text not null default 'monthly_commitment',
  is_active              boolean not null default true,
  created_at             timestamptz not null default now (),
  updated_at             timestamptz not null default now (),
  constraint membership_offering_term_months_positive
    check (term_months > 0),
  constraint membership_offering_term_price_positive
    check (price_cents > 0),
  constraint membership_offering_term_billing_type_check
    check (billing_type in ('monthly_commitment', 'prepaid_full_term')),
  unique (membership_offering_id, term_months)
);

create index if not exists membership_offering_term_offering_id_idx
  on public.membership_offering_term (membership_offering_id);

create trigger membership_offering_term_set_updated_at
  before update on public.membership_offering_term
  for each row execute procedure public.set_updated_at ();

comment on table public.membership_offering_term is
  'Sellable term for a gym product. price_cents is the quoted monthly rate for that term commitment.';

create table if not exists public.membership_offering_component (
  id                     uuid primary key default gen_random_uuid (),
  membership_offering_id uuid not null references public.membership_offering (id) on delete cascade,
  component_type         text not null,
  program_library_id     uuid references public.program_library (id) on delete cascade,
  capability_code        text,
  created_at             timestamptz not null default now (),
  constraint membership_offering_component_type_check
    check (component_type in ('program_library', 'capability')),
  constraint membership_offering_component_target_check
    check (
      (component_type = 'program_library' and program_library_id is not null and capability_code is null)
      or
      (component_type = 'capability' and program_library_id is null and capability_code is not null)
    ),
  constraint membership_offering_component_capability_code_check
    check (
      capability_code is null
      or capability_code in ('open_gym', 'access_24_7')
    )
);

create unique index if not exists membership_offering_component_program_library_unique_idx
  on public.membership_offering_component (membership_offering_id, program_library_id)
  where component_type = 'program_library';

create unique index if not exists membership_offering_component_capability_unique_idx
  on public.membership_offering_component (membership_offering_id, capability_code)
  where component_type = 'capability';

create or replace function public.membership_offering_component_validate ()
returns trigger
language plpgsql
as $$
declare
  v_gym_id uuid;
begin
  if new.component_type <> 'program_library' then
    return new;
  end if;

  select mo.gym_id
  into v_gym_id
  from public.membership_offering mo
  where mo.id = new.membership_offering_id;

  if v_gym_id is null then
    raise exception 'membership_offering_component: invalid membership_offering_id %',
      new.membership_offering_id;
  end if;

  if not exists (
    select 1
    from public.program_library pl
    where pl.id = new.program_library_id
      and pl.gym_id = v_gym_id
  ) then
    raise exception 'membership_offering_component: program_library % must belong to gym %',
      new.program_library_id, v_gym_id;
  end if;

  return new;
end;
$$;

create trigger membership_offering_component_validate_trg
  before insert or update on public.membership_offering_component
  for each row execute procedure public.membership_offering_component_validate ();

comment on table public.membership_offering_component is
  'Maps one sellable offering to one or more access benefits: program_library rows and/or capability codes.';

create table if not exists public.athlete_offering_subscription (
  id                          uuid primary key default gen_random_uuid (),
  contact_id                  uuid not null references public.contact (id) on delete cascade,
  gym_id                      uuid not null references public.gym (id) on delete cascade,
  fitness_membership_id       uuid references public.fitness_membership (id) on delete set null,
  membership_offering_id      uuid not null references public.membership_offering (id) on delete restrict,
  membership_offering_term_id uuid not null references public.membership_offering_term (id) on delete restrict,
  claimed_from_track_link_id  uuid references public.fitness_track_link (id) on delete set null,
  sold_price_cents            integer not null,
  sold_commitment_total_cents integer not null,
  currency                    text not null default 'USD',
  status                      text not null default 'active',
  auto_renew                  boolean not null default false,
  start_date                  date not null default current_date,
  end_date                    date,
  created_at                  timestamptz not null default now (),
  updated_at                  timestamptz not null default now (),
  constraint athlete_offering_subscription_status_check
    check (status in ('active', 'trial', 'paused', 'cancelled', 'expired')),
  constraint athlete_offering_subscription_price_positive
    check (sold_price_cents > 0 and sold_commitment_total_cents > 0),
  constraint athlete_offering_subscription_date_check
    check (end_date is null or end_date >= start_date)
);

create unique index if not exists athlete_offering_subscription_active_unique_idx
  on public.athlete_offering_subscription (contact_id, gym_id, membership_offering_id)
  where status in ('active', 'trial', 'paused');

create index if not exists athlete_offering_subscription_contact_id_idx
  on public.athlete_offering_subscription (contact_id);

create index if not exists athlete_offering_subscription_gym_id_idx
  on public.athlete_offering_subscription (gym_id);

create trigger athlete_offering_subscription_set_updated_at
  before update on public.athlete_offering_subscription
  for each row execute procedure public.set_updated_at ();

create or replace function public.athlete_offering_subscription_validate ()
returns trigger
language plpgsql
as $$
declare
  v_offering_gym_id uuid;
  v_term_offering_id uuid;
begin
  select mo.gym_id, mot.membership_offering_id
  into v_offering_gym_id, v_term_offering_id
  from public.membership_offering_term mot
  join public.membership_offering mo on mo.id = mot.membership_offering_id
  where mot.id = new.membership_offering_term_id;

  if v_offering_gym_id is null then
    raise exception 'athlete_offering_subscription: invalid membership_offering_term_id %',
      new.membership_offering_term_id;
  end if;

  if v_term_offering_id <> new.membership_offering_id then
    raise exception 'athlete_offering_subscription: term % does not belong to offering %',
      new.membership_offering_term_id, new.membership_offering_id;
  end if;

  if v_offering_gym_id <> new.gym_id then
    raise exception 'athlete_offering_subscription: offering gym % does not match row gym %',
      v_offering_gym_id, new.gym_id;
  end if;

  if new.fitness_membership_id is not null and not exists (
    select 1
    from public.fitness_membership fm
    where fm.id = new.fitness_membership_id
      and fm.contact_id = new.contact_id
      and fm.gym_id = new.gym_id
  ) then
    raise exception 'athlete_offering_subscription: fitness_membership % must belong to contact % in gym %',
      new.fitness_membership_id, new.contact_id, new.gym_id;
  end if;

  return new;
end;
$$;

create trigger athlete_offering_subscription_validate_trg
  before insert or update on public.athlete_offering_subscription
  for each row execute procedure public.athlete_offering_subscription_validate ();

comment on table public.athlete_offering_subscription is
  'Commercial snapshot of what an athlete bought: offering term, sold price, dates, and lifecycle. Entitlements fan out from this row.';

create table if not exists public.contact_gym_capability_grant (
  id                               uuid primary key default gen_random_uuid (),
  contact_id                       uuid not null references public.contact (id) on delete cascade,
  gym_id                           uuid not null references public.gym (id) on delete cascade,
  fitness_membership_id            uuid references public.fitness_membership (id) on delete set null,
  athlete_offering_subscription_id uuid references public.athlete_offering_subscription (id) on delete cascade,
  capability_code                  text not null,
  status                           text not null default 'active',
  start_date                       date not null default current_date,
  end_date                         date,
  created_at                       timestamptz not null default now (),
  updated_at                       timestamptz not null default now (),
  constraint contact_gym_capability_grant_capability_code_check
    check (capability_code in ('open_gym', 'access_24_7')),
  constraint contact_gym_capability_grant_status_check
    check (status in ('active', 'trial', 'paused', 'cancelled', 'expired')),
  constraint contact_gym_capability_grant_date_check
    check (end_date is null or end_date >= start_date)
);

create unique index if not exists contact_gym_capability_grant_active_unique_idx
  on public.contact_gym_capability_grant (contact_id, gym_id, capability_code)
  where status in ('active', 'trial', 'paused');

create index if not exists contact_gym_capability_grant_contact_id_idx
  on public.contact_gym_capability_grant (contact_id);

create index if not exists contact_gym_capability_grant_gym_id_idx
  on public.contact_gym_capability_grant (gym_id);

create trigger contact_gym_capability_grant_set_updated_at
  before update on public.contact_gym_capability_grant
  for each row execute procedure public.set_updated_at ();

create or replace function public.contact_gym_capability_grant_validate ()
returns trigger
language plpgsql
as $$
begin
  if new.fitness_membership_id is not null and not exists (
    select 1
    from public.fitness_membership fm
    where fm.id = new.fitness_membership_id
      and fm.contact_id = new.contact_id
      and fm.gym_id = new.gym_id
  ) then
    raise exception 'contact_gym_capability_grant: fitness_membership % must belong to contact % in gym %',
      new.fitness_membership_id, new.contact_id, new.gym_id;
  end if;

  if new.athlete_offering_subscription_id is not null and not exists (
    select 1
    from public.athlete_offering_subscription aos
    where aos.id = new.athlete_offering_subscription_id
      and aos.contact_id = new.contact_id
      and aos.gym_id = new.gym_id
  ) then
    raise exception 'contact_gym_capability_grant: offering subscription % must belong to contact % in gym %',
      new.athlete_offering_subscription_id, new.contact_id, new.gym_id;
  end if;

  return new;
end;
$$;

create trigger contact_gym_capability_grant_validate_trg
  before insert or update on public.contact_gym_capability_grant
  for each row execute procedure public.contact_gym_capability_grant_validate ();

comment on table public.contact_gym_capability_grant is
  'Capability entitlement ledger for non-library benefits such as open gym or 24/7 access.';

create or replace function public.has_active_capability (
  p_gym_id uuid,
  p_capability_code text
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.contact_gym_capability_grant g
    where g.contact_id = public.auth_contact_id ()
      and g.gym_id = p_gym_id
      and g.capability_code = p_capability_code
      and g.status in ('active', 'trial')
      and (g.end_date is null or g.end_date >= current_date)
  );
$$;

comment on function public.has_active_capability (uuid, text) is
  'Returns whether the current auth user has an active/trial non-library capability grant for the given gym.';

-- ---------------------------------------------------------------------------
-- 3. Offerings under RLS (member read, admin write; athlete rows are self-readable)
-- ---------------------------------------------------------------------------
alter table public.membership_offering enable row level security;
alter table public.membership_offering_term enable row level security;
alter table public.membership_offering_component enable row level security;
alter table public.athlete_offering_subscription enable row level security;
alter table public.contact_gym_capability_grant enable row level security;

create policy membership_offering_select on public.membership_offering
  for select using (gym_id in (select public.user_gym_ids ()));

create policy membership_offering_insert on public.membership_offering
  for insert with check (public.is_gym_admin_scoped (gym_id));

create policy membership_offering_update on public.membership_offering
  for update using (public.is_gym_admin_scoped (gym_id))
  with check (public.is_gym_admin_scoped (gym_id));

create policy membership_offering_term_select on public.membership_offering_term
  for select using (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_term.membership_offering_id
        and mo.gym_id in (select public.user_gym_ids ())
    )
  );

create policy membership_offering_term_insert on public.membership_offering_term
  for insert with check (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_term.membership_offering_id
        and public.is_gym_admin_scoped (mo.gym_id)
    )
  );

create policy membership_offering_term_update on public.membership_offering_term
  for update using (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_term.membership_offering_id
        and public.is_gym_admin_scoped (mo.gym_id)
    )
  )
  with check (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_term.membership_offering_id
        and public.is_gym_admin_scoped (mo.gym_id)
    )
  );

create policy membership_offering_component_select on public.membership_offering_component
  for select using (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_component.membership_offering_id
        and mo.gym_id in (select public.user_gym_ids ())
    )
  );

create policy membership_offering_component_insert on public.membership_offering_component
  for insert with check (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_component.membership_offering_id
        and public.is_gym_admin_scoped (mo.gym_id)
    )
  );

create policy membership_offering_component_update on public.membership_offering_component
  for update using (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_component.membership_offering_id
        and public.is_gym_admin_scoped (mo.gym_id)
    )
  )
  with check (
    exists (
      select 1
      from public.membership_offering mo
      where mo.id = membership_offering_component.membership_offering_id
        and public.is_gym_admin_scoped (mo.gym_id)
    )
  );

create policy athlete_offering_subscription_select on public.athlete_offering_subscription
  for select using (
    contact_id = public.auth_contact_id ()
    or gym_id in (select public.user_gym_ids ())
  );

create policy athlete_offering_subscription_insert on public.athlete_offering_subscription
  for insert with check (public.is_gym_admin_scoped (gym_id));

create policy athlete_offering_subscription_update on public.athlete_offering_subscription
  for update using (public.is_gym_admin_scoped (gym_id))
  with check (public.is_gym_admin_scoped (gym_id));

create policy contact_gym_capability_grant_select on public.contact_gym_capability_grant
  for select using (
    contact_id = public.auth_contact_id ()
    or gym_id in (select public.user_gym_ids ())
  );

create policy contact_gym_capability_grant_insert on public.contact_gym_capability_grant
  for insert with check (public.is_gym_admin_scoped (gym_id));

create policy contact_gym_capability_grant_update on public.contact_gym_capability_grant
  for update using (public.is_gym_admin_scoped (gym_id))
  with check (public.is_gym_admin_scoped (gym_id));

-- ---------------------------------------------------------------------------
-- 4. Evolve fitness_track_link options from raw libraries to offering terms
-- ---------------------------------------------------------------------------
drop table if exists public.fitness_track_link_option cascade;
drop function if exists public.fitness_track_link_option_validate ();

create table public.fitness_track_link_option (
  link_id                     uuid not null references public.fitness_track_link (id) on delete cascade,
  membership_offering_term_id uuid not null references public.membership_offering_term (id) on delete cascade,
  created_at                  timestamptz not null default now (),
  primary key (link_id, membership_offering_term_id)
);

create index if not exists fitness_track_link_option_term_idx
  on public.fitness_track_link_option (membership_offering_term_id);

comment on table public.fitness_track_link_option is
  'Rows linking a fitness_track_link to a sellable membership_offering_term. The offering term must belong to the link gym.';

create or replace function public.fitness_track_link_option_validate ()
returns trigger
language plpgsql
as $$
declare
  v_link_gym_id uuid;
  v_term_gym_id uuid;
begin
  select l.gym_id into v_link_gym_id
  from public.fitness_track_link l
  where l.id = new.link_id;

  if v_link_gym_id is null then
    raise exception 'fitness_track_link_option: invalid link_id %', new.link_id;
  end if;

  select mo.gym_id into v_term_gym_id
  from public.membership_offering_term mot
  join public.membership_offering mo on mo.id = mot.membership_offering_id
  where mot.id = new.membership_offering_term_id;

  if v_term_gym_id is null then
    raise exception 'fitness_track_link_option: invalid membership_offering_term_id %',
      new.membership_offering_term_id;
  end if;

  if v_term_gym_id <> v_link_gym_id then
    raise exception 'fitness_track_link_option: offering term % must belong to gym %',
      new.membership_offering_term_id, v_link_gym_id;
  end if;

  return new;
end;
$$;

create trigger fitness_track_link_option_validate_trg
  before insert or update on public.fitness_track_link_option
  for each row execute procedure public.fitness_track_link_option_validate ();

alter table public.fitness_track_link_option enable row level security;

create policy fitness_track_link_option_select on public.fitness_track_link_option
  for select using (
    exists (
      select 1
      from public.fitness_track_link l
      where l.id = fitness_track_link_option.link_id
        and public.is_gym_admin_scoped (l.gym_id)
    )
  );

create policy fitness_track_link_option_insert on public.fitness_track_link_option
  for insert with check (
    exists (
      select 1
      from public.fitness_track_link l
      where l.id = fitness_track_link_option.link_id
        and public.is_gym_admin_scoped (l.gym_id)
    )
  );

create policy fitness_track_link_option_update on public.fitness_track_link_option
  for update using (
    exists (
      select 1
      from public.fitness_track_link l
      where l.id = fitness_track_link_option.link_id
        and public.is_gym_admin_scoped (l.gym_id)
    )
  )
  with check (
    exists (
      select 1
      from public.fitness_track_link l
      where l.id = fitness_track_link_option.link_id
        and public.is_gym_admin_scoped (l.gym_id)
    )
  );

create policy fitness_track_link_option_delete on public.fitness_track_link_option
  for delete using (
    exists (
      select 1
      from public.fitness_track_link l
      where l.id = fitness_track_link_option.link_id
        and public.is_gym_admin_scoped (l.gym_id)
    )
  );

comment on table public.fitness_track_link is
  'Productized invite: athlete opens link, picks a membership_offering_term, and claim creates commercial subscription plus entitlements.';

comment on column public.fitness_track_link.redemption_count is
  'Increments only when claim_fitness_track_link creates at least one new membership/offering/entitlement row (not pure reactivations).';

-- ---------------------------------------------------------------------------
-- 5. Public RPC payload: show offering terms, prices, and included benefits
-- ---------------------------------------------------------------------------
create or replace function public.get_fitness_track_link_public (p_link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.fitness_track_link%rowtype;
  v_result jsonb;
begin
  select * into v_link
  from public.fitness_track_link
  where id = p_link_id;

  if not found then
    return null;
  end if;

  if v_link.revoked_at is not null then
    return null;
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return null;
  end if;

  select jsonb_build_object(
    'link_id', v_link.id,
    'gym_id', v_link.gym_id,
    'gym_name', g.name,
    'label', v_link.label,
    'options', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'membership_offering_term_id', mot.id,
            'membership_offering_id', mo.id,
            'offering_name', mo.name,
            'description', mo.description,
            'term_months', mot.term_months,
            'price_cents', mot.price_cents,
            'commitment_total_cents', mot.price_cents * mot.term_months,
            'currency', mot.currency,
            'billing_type', mot.billing_type,
            'included_program_libraries', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'program_library_id', pl.id,
                    'name', pl.name
                  )
                  order by pl.name
                )
                from public.membership_offering_component moc
                join public.program_library pl on pl.id = moc.program_library_id
                where moc.membership_offering_id = mo.id
                  and moc.component_type = 'program_library'
              ),
              '[]'::jsonb
            ),
            'included_capabilities', coalesce(
              (
                select jsonb_agg(moc.capability_code order by moc.capability_code)
                from public.membership_offering_component moc
                where moc.membership_offering_id = mo.id
                  and moc.component_type = 'capability'
              ),
              '[]'::jsonb
            )
          )
          order by mo.name, mot.term_months
        )
        from public.fitness_track_link_option o
        join public.membership_offering_term mot on mot.id = o.membership_offering_term_id
        join public.membership_offering mo on mo.id = mot.membership_offering_id
        where o.link_id = v_link.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.gym g
  where g.id = v_link.gym_id;

  return v_result;
end;
$$;

comment on function public.get_fitness_track_link_public (uuid) is
  'Returns gym + sellable offering terms for a valid link token; includes included libraries/capabilities and pricing metadata. Inactive/revoked/expired links return null.';

-- ---------------------------------------------------------------------------
-- 6. Claim RPC: one offering term -> commercial record + entitlement fanout
-- ---------------------------------------------------------------------------
drop function if exists public.claim_fitness_track_link (uuid, uuid);

create or replace function public.claim_fitness_track_link (
  p_link_id uuid,
  p_membership_offering_term_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.fitness_track_link%rowtype;
  v_contact_id uuid;
  v_fm_id uuid;
  v_offering_id uuid;
  v_offering_name text;
  v_term_months smallint;
  v_price_cents integer;
  v_currency text;
  v_end_date date;
  v_offering_sub_id uuid;
  v_active_offering_term_id uuid;
  v_created_fm boolean := false;
  v_created_offering_subscription boolean := false;
  v_created_track_subscriptions integer := 0;
  v_created_capability_grants integer := 0;
  v_will_consume_slot boolean := false;
  v_track_id uuid;
  v_capability_grant_id uuid;
  v_component record;
begin
  if auth.uid () is null then
    raise exception 'claim_fitness_track_link: authentication required';
  end if;

  v_contact_id := public.auth_contact_id ();

  if v_contact_id is null then
    raise exception 'claim_fitness_track_link: no contact for current user';
  end if;

  select * into v_link
  from public.fitness_track_link
  where id = p_link_id
  for update;

  if not found then
    raise exception 'claim_fitness_track_link: link not found';
  end if;

  if v_link.revoked_at is not null then
    raise exception 'claim_fitness_track_link: link revoked';
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'claim_fitness_track_link: link expired';
  end if;

  select mo.id, mo.name, mot.term_months, mot.price_cents, mot.currency
  into v_offering_id, v_offering_name, v_term_months, v_price_cents, v_currency
  from public.fitness_track_link_option o
  join public.membership_offering_term mot on mot.id = o.membership_offering_term_id
  join public.membership_offering mo on mo.id = mot.membership_offering_id
  where o.link_id = p_link_id
    and o.membership_offering_term_id = p_membership_offering_term_id;

  if v_offering_id is null then
    raise exception 'claim_fitness_track_link: membership offering term not offered by this link';
  end if;

  v_end_date := ((current_date + make_interval(months => v_term_months)) - interval '1 day')::date;

  if not exists (
    select 1
    from public.fitness_membership fm
    where fm.contact_id = v_contact_id
      and fm.gym_id = v_link.gym_id
      and fm.role = 'athlete'
  ) then
    v_will_consume_slot := true;
  end if;

  if not exists (
    select 1
    from public.athlete_offering_subscription aos
    where aos.contact_id = v_contact_id
      and aos.gym_id = v_link.gym_id
      and aos.membership_offering_term_id = p_membership_offering_term_id
  ) then
    v_will_consume_slot := true;
  end if;

  if exists (
    select 1
    from public.membership_offering_component moc
    where moc.membership_offering_id = v_offering_id
      and moc.component_type = 'program_library'
      and not exists (
        select 1
        from public.athlete_subscription s
        where s.contact_id = v_contact_id
          and s.gym_id = v_link.gym_id
          and s.program_library_id = moc.program_library_id
          and s.subscription_scope = 'athlete_track'
      )
  ) then
    v_will_consume_slot := true;
  end if;

  if exists (
    select 1
    from public.membership_offering_component moc
    where moc.membership_offering_id = v_offering_id
      and moc.component_type = 'capability'
      and not exists (
        select 1
        from public.contact_gym_capability_grant g
        where g.contact_id = v_contact_id
          and g.gym_id = v_link.gym_id
          and g.capability_code = moc.capability_code
      )
  ) then
    v_will_consume_slot := true;
  end if;

  if v_link.max_redemptions is not null
     and v_will_consume_slot
     and v_link.redemption_count >= v_link.max_redemptions then
    raise exception 'claim_fitness_track_link: link redemption limit reached';
  end if;

  -- fitness_membership (athlete)
  select id into v_fm_id
  from public.fitness_membership
  where contact_id = v_contact_id
    and gym_id = v_link.gym_id
    and role = 'athlete';

  if v_fm_id is null then
    insert into public.fitness_membership (
      contact_id, gym_id, role, membership_status, join_date
    )
    values (
      v_contact_id, v_link.gym_id, 'athlete', 'active', current_date
    )
    returning id into v_fm_id;

    v_created_fm := true;
  else
    update public.fitness_membership
    set
      membership_status = 'active',
      join_date = coalesce (join_date, current_date),
      updated_at = now ()
    where id = v_fm_id
      and (
        membership_status is distinct from 'active'
        or join_date is null
      );
  end if;

  -- athlete_offering_subscription
  select id, membership_offering_term_id
  into v_offering_sub_id, v_active_offering_term_id
  from public.athlete_offering_subscription
  where contact_id = v_contact_id
    and gym_id = v_link.gym_id
    and membership_offering_id = v_offering_id
    and status in ('active', 'trial', 'paused')
  order by updated_at desc
  limit 1;

  if v_offering_sub_id is not null then
    if v_active_offering_term_id <> p_membership_offering_term_id then
      raise exception 'claim_fitness_track_link: active offering "%" already exists for this athlete; term changes must be handled outside claim',
        v_offering_name;
    end if;

    update public.athlete_offering_subscription
    set
      fitness_membership_id = coalesce (fitness_membership_id, v_fm_id),
      claimed_from_track_link_id = p_link_id,
      updated_at = now ()
    where id = v_offering_sub_id
      and (
        fitness_membership_id is distinct from v_fm_id
        or claimed_from_track_link_id is distinct from p_link_id
      );
  else
    select id into v_offering_sub_id
    from public.athlete_offering_subscription
    where contact_id = v_contact_id
      and gym_id = v_link.gym_id
      and membership_offering_term_id = p_membership_offering_term_id
    order by updated_at desc
    limit 1;

    if v_offering_sub_id is null then
      insert into public.athlete_offering_subscription (
        contact_id,
        gym_id,
        fitness_membership_id,
        membership_offering_id,
        membership_offering_term_id,
        claimed_from_track_link_id,
        sold_price_cents,
        sold_commitment_total_cents,
        currency,
        status,
        auto_renew,
        start_date,
        end_date
      )
      values (
        v_contact_id,
        v_link.gym_id,
        v_fm_id,
        v_offering_id,
        p_membership_offering_term_id,
        p_link_id,
        v_price_cents,
        v_price_cents * v_term_months,
        v_currency,
        'active',
        false,
        current_date,
        v_end_date
      )
      returning id into v_offering_sub_id;

      v_created_offering_subscription := true;
    else
      update public.athlete_offering_subscription
      set
        fitness_membership_id = v_fm_id,
        membership_offering_id = v_offering_id,
        claimed_from_track_link_id = p_link_id,
        sold_price_cents = v_price_cents,
        sold_commitment_total_cents = v_price_cents * v_term_months,
        currency = v_currency,
        status = 'active',
        start_date = current_date,
        end_date = v_end_date,
        updated_at = now ()
      where id = v_offering_sub_id;
    end if;
  end if;

  -- Fan out offering components into access rows
  for v_component in
    select component_type, program_library_id, capability_code
    from public.membership_offering_component
    where membership_offering_id = v_offering_id
    order by component_type, program_library_id, capability_code
  loop
    if v_component.component_type = 'program_library' then
      select id into v_track_id
      from public.athlete_subscription
      where contact_id = v_contact_id
        and gym_id = v_link.gym_id
        and program_library_id = v_component.program_library_id
        and subscription_scope = 'athlete_track'
        and status in ('active', 'trial', 'paused')
      order by updated_at desc
      limit 1;

      if v_track_id is null then
        select id into v_track_id
        from public.athlete_subscription
        where contact_id = v_contact_id
          and gym_id = v_link.gym_id
          and program_library_id = v_component.program_library_id
          and subscription_scope = 'athlete_track'
        order by updated_at desc
        limit 1;

        if v_track_id is null then
          insert into public.athlete_subscription (
            contact_id,
            gym_id,
            fitness_membership_id,
            program_library_id,
            access_level,
            status,
            start_date,
            end_date,
            subscription_scope
          )
          values (
            v_contact_id,
            v_link.gym_id,
            v_fm_id,
            v_component.program_library_id,
            'general',
            'active',
            current_date,
            v_end_date,
            'athlete_track'
          );

          v_created_track_subscriptions := v_created_track_subscriptions + 1;
        else
          update public.athlete_subscription
          set
            fitness_membership_id = v_fm_id,
            access_level = 'general',
            status = 'active',
            start_date = current_date,
            end_date = v_end_date,
            updated_at = now ()
          where id = v_track_id;
        end if;
      end if;
    else
      select id into v_capability_grant_id
      from public.contact_gym_capability_grant
      where contact_id = v_contact_id
        and gym_id = v_link.gym_id
        and capability_code = v_component.capability_code
        and status in ('active', 'trial', 'paused')
      order by updated_at desc
      limit 1;

      if v_capability_grant_id is null then
        select id into v_capability_grant_id
        from public.contact_gym_capability_grant
        where contact_id = v_contact_id
          and gym_id = v_link.gym_id
          and capability_code = v_component.capability_code
        order by updated_at desc
        limit 1;

        if v_capability_grant_id is null then
          insert into public.contact_gym_capability_grant (
            contact_id,
            gym_id,
            fitness_membership_id,
            athlete_offering_subscription_id,
            capability_code,
            status,
            start_date,
            end_date
          )
          values (
            v_contact_id,
            v_link.gym_id,
            v_fm_id,
            v_offering_sub_id,
            v_component.capability_code,
            'active',
            current_date,
            v_end_date
          );

          v_created_capability_grants := v_created_capability_grants + 1;
        else
          update public.contact_gym_capability_grant
          set
            fitness_membership_id = v_fm_id,
            athlete_offering_subscription_id = v_offering_sub_id,
            status = 'active',
            start_date = current_date,
            end_date = v_end_date,
            updated_at = now ()
          where id = v_capability_grant_id;
        end if;
      end if;
    end if;
  end loop;

  if v_created_fm
     or v_created_offering_subscription
     or v_created_track_subscriptions > 0
     or v_created_capability_grants > 0 then
    update public.fitness_track_link
    set redemption_count = redemption_count + 1,
        updated_at = now ()
    where id = p_link_id;
  end if;

  return jsonb_build_object(
    'gym_id', v_link.gym_id,
    'membership_offering_id', v_offering_id,
    'membership_offering_term_id', p_membership_offering_term_id,
    'athlete_offering_subscription_id', v_offering_sub_id,
    'created_membership', v_created_fm,
    'created_offering_subscription', v_created_offering_subscription,
    'created_track_subscriptions', v_created_track_subscriptions,
    'created_capability_grants', v_created_capability_grants,
    'end_date', v_end_date
  );
end;
$$;

comment on function public.claim_fitness_track_link (uuid, uuid) is
  'Authenticated athlete: validates link + offering term, ensures athlete fitness_membership, creates/reactivates athlete_offering_subscription, and fans out program_library + capability entitlements.';

