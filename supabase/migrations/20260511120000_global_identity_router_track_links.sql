-- =============================================================================
-- Global Identity Router: last-active gym on profiles
-- Productized track links: fitness_track_link + options + public RPCs
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles: remember gym context for Gym Switcher / default route
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists last_active_gym_id uuid
    references public.gym (id) on delete set null,
  add column if not exists last_active_gym_at timestamptz;

comment on column public.profiles.last_active_gym_id is
  'Most recently selected gym for multi-tenant UX; must be a gym the user has active fitness_membership for.';
comment on column public.profiles.last_active_gym_at is
  'Timestamp when last_active_gym_id was set.';

create index if not exists profiles_last_active_gym_id_idx
  on public.profiles (last_active_gym_id)
  where last_active_gym_id is not null;

-- ---------------------------------------------------------------------------
-- 2. fitness_track_link + options (gym-created shareable onboarding links)
-- ---------------------------------------------------------------------------
create table public.fitness_track_link (
  id                    uuid primary key default gen_random_uuid (),
  gym_id                uuid not null references public.gym (id) on delete cascade,
  label                 text,
  created_by_contact_id uuid references public.contact (id) on delete set null,
  expires_at            timestamptz,
  revoked_at            timestamptz,
  max_redemptions       integer,
  redemption_count      integer not null default 0,
  created_at            timestamptz not null default now (),
  updated_at            timestamptz not null default now (),
  constraint fitness_track_link_max_redemptions_positive
    check (max_redemptions is null or max_redemptions > 0)
);

create index if not exists fitness_track_link_gym_id_idx
  on public.fitness_track_link (gym_id);

create trigger fitness_track_link_set_updated_at
  before update on public.fitness_track_link
  for each row execute procedure public.set_updated_at ();

comment on table public.fitness_track_link is
  'Productized invite: athlete opens link, picks a program_library option, claims via RPC to create membership + athlete_track subscription.';
comment on column public.fitness_track_link.redemption_count is
  'Increments only when claim_fitness_track_link creates a new fitness_membership and/or athlete_subscription row (not reactivations).';

create table public.fitness_track_link_option (
  link_id             uuid not null references public.fitness_track_link (id) on delete cascade,
  program_library_id  uuid not null references public.program_library (id) on delete cascade,
  created_at          timestamptz not null default now (),
  primary key (link_id, program_library_id)
);

create index if not exists fitness_track_link_option_library_idx
  on public.fitness_track_link_option (program_library_id);

comment on table public.fitness_track_link_option is
  'Allowed program_library tracks for this link; each library must belong to the link gym (enforced by trigger).';

-- Trigger: each option library must belong to the link's gym
create or replace function public.fitness_track_link_option_validate ()
returns trigger
language plpgsql
as $$
declare
  v_gym_id uuid;
begin
  select l.gym_id into v_gym_id
  from public.fitness_track_link l
  where l.id = new.link_id;

  if v_gym_id is null then
    raise exception 'fitness_track_link_option: invalid link_id %', new.link_id;
  end if;

  if not exists (
    select 1
    from public.program_library pl
    where pl.id = new.program_library_id
      and pl.gym_id = v_gym_id
  ) then
    raise exception 'fitness_track_link_option: program_library % must belong to gym %',
      new.program_library_id, v_gym_id;
  end if;

  return new;
end;
$$;

create trigger fitness_track_link_option_validate_trg
  before insert or update on public.fitness_track_link_option
  for each row execute procedure public.fitness_track_link_option_validate ();

-- ---------------------------------------------------------------------------
-- 3. RLS (staff manage links; no public table reads — use RPC)
-- ---------------------------------------------------------------------------
alter table public.fitness_track_link enable row level security;
alter table public.fitness_track_link_option enable row level security;

create policy fitness_track_link_select on public.fitness_track_link
  for select using (public.is_gym_admin_scoped (gym_id));

create policy fitness_track_link_insert on public.fitness_track_link
  for insert with check (public.is_gym_admin_scoped (gym_id));

create policy fitness_track_link_update on public.fitness_track_link
  for update using (public.is_gym_admin_scoped (gym_id))
  with check (public.is_gym_admin_scoped (gym_id));

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

-- ---------------------------------------------------------------------------
-- 4. RPC: public metadata for invite landing (anon + authenticated)
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
            'program_library_id', pl.id,
            'name', pl.name,
            'description', pl.description,
            'sport_type', pl.sport_type
          )
          order by pl.name
        )
        from public.fitness_track_link_option o
        join public.program_library pl on pl.id = o.program_library_id
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
  'Returns gym + track options for a valid link token; no auth required. Inactive/revoked/expired links return null.';

-- ---------------------------------------------------------------------------
-- 5. RPC: athlete claims link → fitness_membership (athlete) + athlete_subscription
-- ---------------------------------------------------------------------------
create or replace function public.claim_fitness_track_link (
  p_link_id uuid,
  p_program_library_id uuid
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
  v_sub_id uuid;
  v_created_fm boolean := false;
  v_created_sub boolean := false;
  v_will_consume_slot boolean := false;
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

  if not exists (
    select 1
    from public.fitness_track_link_option o
    where o.link_id = p_link_id
      and o.program_library_id = p_program_library_id
  ) then
    raise exception 'claim_fitness_track_link: program_library not offered by this link';
  end if;

  select id into v_fm_id
  from public.fitness_membership
  where contact_id = v_contact_id
    and gym_id = v_link.gym_id
    and role = 'athlete';

  if v_fm_id is null then
    v_will_consume_slot := true;
  elsif not exists (
    select 1
    from public.athlete_subscription s
    where s.contact_id = v_contact_id
      and s.gym_id = v_link.gym_id
      and s.program_library_id = p_program_library_id
      and s.subscription_scope = 'athlete_track'
      and s.status = 'active'
  ) then
    v_will_consume_slot := true;
  end if;

  if v_link.max_redemptions is not null
     and v_will_consume_slot
     and v_link.redemption_count >= v_link.max_redemptions then
    raise exception 'claim_fitness_track_link: link redemption limit reached';
  end if;

  -- fitness_membership (athlete)
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
    set membership_status = 'active', updated_at = now ()
    where id = v_fm_id
      and membership_status <> 'active';
  end if;

  -- athlete_subscription (track)
  select id into v_sub_id
  from public.athlete_subscription
  where contact_id = v_contact_id
    and gym_id = v_link.gym_id
    and program_library_id = p_program_library_id
    and subscription_scope = 'athlete_track';

  if v_sub_id is null then
    insert into public.athlete_subscription (
      contact_id,
      gym_id,
      fitness_membership_id,
      program_library_id,
      subscription_scope,
      status,
      start_date
    )
    values (
      v_contact_id,
      v_link.gym_id,
      v_fm_id,
      p_program_library_id,
      'athlete_track',
      'active',
      current_date
    )
    returning id into v_sub_id;

    v_created_sub := true;
  else
    update public.athlete_subscription
    set
      status = 'active',
      fitness_membership_id = coalesce (fitness_membership_id, v_fm_id),
      updated_at = now ()
    where id = v_sub_id
      and (
        status is distinct from 'active'
        or fitness_membership_id is distinct from v_fm_id
      );
  end if;

  if v_created_fm or v_created_sub then
    update public.fitness_track_link
    set redemption_count = redemption_count + 1,
        updated_at = now ()
    where id = p_link_id;
  end if;

  return jsonb_build_object(
    'gym_id', v_link.gym_id,
    'program_library_id', p_program_library_id,
    'created_membership', v_created_fm,
    'created_subscription', v_created_sub
  );
end;
$$;

comment on function public.claim_fitness_track_link (uuid, uuid) is
  'Authenticated athlete: validates link + option, ensures athlete fitness_membership and athlete_track subscription; increments redemption_count only when a new membership or subscription row is inserted.';

-- Grants: public discovery + authenticated claim
revoke all on function public.get_fitness_track_link_public (uuid) from public;
grant execute on function public.get_fitness_track_link_public (uuid) to anon, authenticated;

revoke all on function public.claim_fitness_track_link (uuid, uuid) from public;
grant execute on function public.claim_fitness_track_link (uuid, uuid) to authenticated;
