-- ============================================================================
-- Critical guardrails for identity, tenant ownership, and athlete-custom rows.
-- These are forward fixes for RLS/trigger gaps introduced by recent persona and
-- athlete-custom programming work.
-- ============================================================================

-- Authenticated clients may create their own auth-linked contact or an unclaimed
-- contact, but never bind a contact row to another auth user.
drop policy if exists contact_insert on public.contact;

create policy contact_insert on public.contact
  for insert to authenticated
  with check (user_id is null or user_id = auth.uid ());

-- A contact.user_id swap changes auth_contact_id() and therefore every RLS
-- decision built on the user's identity. Keep it service-maintained only.
create or replace function public.trg_enforce_contact_identity_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if auth.uid () is not null
     and old.user_id is distinct from new.user_id
  then
    raise exception 'contact.user_id cannot be changed by authenticated clients';
  end if;

  return new;
end;
$$;

drop trigger if exists contact_identity_update_guard on public.contact;

create trigger contact_identity_update_guard
  before update on public.contact
  for each row execute procedure public.trg_enforce_contact_identity_update ();

-- Keep membership rows attached to their original athlete/coach and gym.
-- Admins can still update lifecycle fields or insert a new row for a new role.
create or replace function public.trg_enforce_fitness_membership_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if auth.uid () is not null
     and (
       old.contact_id is distinct from new.contact_id
       or old.gym_id is distinct from new.gym_id
     )
  then
    raise exception 'fitness_membership contact_id and gym_id are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists fitness_membership_update_guard on public.fitness_membership;

create trigger fitness_membership_update_guard
  before update on public.fitness_membership
  for each row execute procedure public.trg_enforce_fitness_membership_update ();

-- Subscription updates must not move entitlements between athletes or gyms, and
-- any membership/library references must stay inside the same tenant boundary.
create or replace function public.trg_enforce_athlete_subscription_write ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and auth.uid () is not null
     and (
       old.contact_id is distinct from new.contact_id
       or old.gym_id is distinct from new.gym_id
     )
  then
    raise exception 'athlete_subscription contact_id and gym_id are immutable';
  end if;

  if new.program_library_id is not null
     and not exists (
       select 1
       from public.program_library pl
       where pl.id = new.program_library_id
         and pl.gym_id = new.gym_id
     )
  then
    raise exception 'athlete_subscription program_library_id must belong to gym_id';
  end if;

  if new.fitness_membership_id is not null
     and not exists (
       select 1
       from public.fitness_membership fm
       where fm.id = new.fitness_membership_id
         and fm.contact_id = new.contact_id
         and fm.gym_id = new.gym_id
     )
  then
    raise exception 'athlete_subscription fitness_membership_id must match contact_id and gym_id';
  end if;

  return new;
end;
$$;

drop trigger if exists athlete_subscription_write_guard on public.athlete_subscription;

create trigger athlete_subscription_write_guard
  before insert or update on public.athlete_subscription
  for each row execute procedure public.trg_enforce_athlete_subscription_write ();

-- Onboarding requests contain owner PII. A gym admin can read requests for their
-- own gym, but admin status at one gym is not a platform-wide read grant.
drop policy if exists onboarding_select on public.gym_onboarding_request;

create policy onboarding_select on public.gym_onboarding_request
  for select using (
    created_contact_id = public.auth_contact_id ()
    or created_account_id in (select public.user_gym_ids ())
    or (
      created_account_id is not null
      and public.is_gym_admin_scoped (created_account_id)
    )
  );

-- benchmark_type / benchmark_definition are platform-wide reference data.
-- Until there is a real platform-admin role, tenant admins must not mutate them.
drop policy if exists benchmark_type_insert on public.benchmark_type;
drop policy if exists benchmark_type_update on public.benchmark_type;
drop policy if exists benchmark_definition_insert on public.benchmark_definition;
drop policy if exists benchmark_definition_update on public.benchmark_definition;

create policy benchmark_type_insert on public.benchmark_type
  for insert to authenticated
  with check (false);

create policy benchmark_type_update on public.benchmark_type
  for update to authenticated
  using (false)
  with check (false);

create policy benchmark_definition_insert on public.benchmark_definition
  for insert to authenticated
  with check (false);

create policy benchmark_definition_update on public.benchmark_definition
  for update to authenticated
  using (false)
  with check (false);

-- Athlete-custom programming can remain personal or attach to a gym where the
-- athlete has active access. It cannot be reparented into an unrelated tenant.
create or replace function public.trg_validate_programming_library_gym ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.gym_id is not null
     and new.program_library_id is not null
     and not exists (
       select 1
       from public.program_library pl
       where pl.id = new.program_library_id
         and pl.gym_id = new.gym_id
     )
  then
    raise exception 'programming program_library_id must belong to gym_id';
  end if;

  return new;
end;
$$;

drop trigger if exists programming_library_gym_guard on public.programming;

create trigger programming_library_gym_guard
  before insert or update on public.programming
  for each row execute procedure public.trg_validate_programming_library_gym ();

create or replace function public.trg_enforce_programming_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_lib uuid := new.program_library_id;
  v_gym uuid := new.gym_id;
  v_prog_ok boolean;
  v_coach_ok boolean;
  v_admin_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if old.created_by_contact_id = public.auth_contact_id ()
     and new.created_by_contact_id = public.auth_contact_id ()
     and old.source = 'athlete_custom'
     and new.source = 'athlete_custom'
  then
    if v_gym is null then
      return new;
    end if;

    if not public.has_active_fm_role (v_gym, 'athlete') then
      raise exception 'Athlete-custom programming can only be attached to gyms where the athlete is active';
    end if;

    if v_lib is not null
       and not public.has_athlete_track_access (v_gym, v_lib)
    then
      raise exception 'Athlete-custom programming library is outside athlete access';
    end if;

    return new;
  end if;

  if v_gym is null then
    raise exception 'Insufficient privileges to update programming';
  end if;

  v_prog_ok :=
    public.has_active_fm_role (v_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_programmer')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_programmer')
      )
    );

  v_admin_ok :=
    public.has_active_fm_role (v_gym, 'admin')
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_admin')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_admin')
      )
    );

  if v_prog_ok or v_admin_ok then
    return new;
  end if;

  v_coach_ok :=
    public.has_active_fm_role (v_gym, 'coach')
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_coach')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_coach')
      )
    );

  if v_coach_ok then
    if (to_jsonb (new) - 'coaches_notes' - 'updated_at')
         = (to_jsonb (old) - 'coaches_notes' - 'updated_at')
    then
      return new;
    end if;
    raise exception 'Coaches may only update coaches_notes on programming';
  end if;

  raise exception 'Insufficient privileges to update programming';
end;
$$;

drop policy if exists pli_insert_athlete_custom on public.programming_line_item;

create policy pli_insert_athlete_custom on public.programming_line_item
  for insert with check (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.created_by_contact_id = public.auth_contact_id ()
        and p.source = 'athlete_custom'
        and (
          p.gym_id is null
          or (
            public.has_active_fm_role (p.gym_id, 'athlete')
            and public.has_athlete_track_access (p.gym_id, p.program_library_id)
          )
        )
    )
  );

create or replace function public.trg_enforce_pli_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_lib uuid;
  v_author uuid;
  v_source text;
  v_prog_ok boolean;
  v_coach_ok boolean;
  v_admin_ok boolean;
  v_athlete_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_gym, v_lib, v_author, v_source
  from public.programming p
  where p.id = new.programming_id;

  if not found then
    raise exception 'Invalid programming_id on programming_line_item';
  end if;

  if v_author = public.auth_contact_id ()
     and v_source = 'athlete_custom'
  then
    if v_gym is null then
      return new;
    end if;

    if public.has_active_fm_role (v_gym, 'athlete')
       and public.has_athlete_track_access (v_gym, v_lib)
    then
      return new;
    end if;

    raise exception 'Athlete-custom line item is outside athlete access';
  end if;

  if v_gym is null then
    raise exception 'Insufficient privileges to update programming_line_item';
  end if;

  v_prog_ok :=
    public.has_active_fm_role (v_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_programmer')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_programmer')
      )
    );

  v_admin_ok :=
    public.has_active_fm_role (v_gym, 'admin')
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_admin')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_admin')
      )
    );

  if v_prog_ok or v_admin_ok then
    return new;
  end if;

  v_coach_ok :=
    public.has_active_fm_role (v_gym, 'coach')
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_coach')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_coach')
      )
    );

  if v_coach_ok then
    return new;
  end if;

  if old.contact_id is null then
    raise exception 'Log class results in athlete_performance (shared line item); do not update this row';
  end if;

  v_athlete_ok :=
    public.has_active_fm_role (v_gym, 'athlete')
    and public.has_athlete_track_access (v_gym, v_lib)
    and new.contact_id = public.auth_contact_id ()
    and old.contact_id = public.auth_contact_id ();

  if v_athlete_ok then
    if (
      to_jsonb (new)
        - 'actual_weight_lifted'
        - 'prescribed_score'
        - 'status'
        - 'completed_at'
        - 'updated_at'
    ) = (
      to_jsonb (old)
        - 'actual_weight_lifted'
        - 'prescribed_score'
        - 'status'
        - 'completed_at'
        - 'updated_at'
    )
    then
      return new;
    end if;
    raise exception 'Athletes may only update results fields on individualized programming_line_item';
  end if;

  raise exception 'Insufficient privileges to update programming_line_item';
end;
$$;

-- Signup must attach exactly one pre-created, unclaimed contact by email instead
-- of creating a duplicate identity that strands memberships/subscriptions.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_contact_id uuid;
  matching_contact_count bigint;
  meta jsonb;
  fn text;
  ln text;
  disp text;
begin
  meta := coalesce (new.raw_user_meta_data, '{}'::jsonb);
  fn := nullif (trim (coalesce (meta->>'first_name', meta->>'given_name')), '');
  ln := nullif (trim (coalesce (meta->>'last_name', meta->>'family_name')), '');
  disp := nullif (trim (coalesce (meta->>'full_name', meta->>'name')), '');

  if disp is null and (fn is not null or ln is not null) then
    disp := trim (coalesce (fn || ' ', '') || coalesce (ln, ''));
  end if;

  if disp is null or disp = '' then
    disp := nullif (trim (split_part (coalesce (new.email, ''), '@', 1)), '');
  end if;

  if disp is null or disp = '' then
    disp := 'User';
  end if;

  select c.id, count(*) over ()
    into new_contact_id, matching_contact_count
  from public.contact c
  where c.user_id is null
    and new.email is not null
    and lower (c.email) = lower (new.email)
  order by c.created_at asc, c.id asc
  limit 1;

  if matching_contact_count = 1 then
    update public.contact as c
    set user_id = new.id,
        email = coalesce (c.email, new.email),
        first_name = coalesce (c.first_name, fn),
        last_name = coalesce (c.last_name, ln)
    where c.id = new_contact_id;
  else
    insert into public.contact as c (user_id, email, first_name, last_name)
    values (new.id, new.email, fn, ln)
    on conflict (user_id) do update
    set email = coalesce (c.email, excluded.email),
        first_name = coalesce (c.first_name, excluded.first_name),
        last_name = coalesce (c.last_name, excluded.last_name)
    returning id into new_contact_id;
  end if;

  insert into public.profiles as p (id, contact_id, display_name)
  values (new.id, new_contact_id, disp)
  on conflict (id) do update
  set contact_id = excluded.contact_id,
      display_name = coalesce (p.display_name, excluded.display_name);

  return new;
end;
$$;

comment on function public.handle_new_user () is
  'After insert on auth.users: links one unclaimed matching contact when present, otherwise creates public.contact, then upserts public.profiles.';
