-- ============================================================================
-- Persona / multi-role RLS: Athlete, Coach, Programmer (ex-head_coach), Admin
-- Add library-scoped staff entitlements via athlete_subscription.subscription_scope
-- Column-level update rules enforced with SECURITY DEFINER triggers.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. fitness_membership.role: rename head_coach -> programmer
-- ---------------------------------------------------------------------------
update public.fitness_membership
set role = 'programmer'
where role = 'head_coach';

alter table public.fitness_membership
  drop constraint if exists fitness_membership_role_check;

alter table public.fitness_membership
  add constraint fitness_membership_role_check
  check (role in ('athlete','coach','programmer','admin','owner'));

-- ---------------------------------------------------------------------------
-- 2. athlete_subscription: staff vs athlete track entitlements
-- ---------------------------------------------------------------------------
alter table public.athlete_subscription
  add column if not exists subscription_scope text
    not null
    default 'athlete_track';

alter table public.athlete_subscription
  drop constraint if exists athlete_subscription_subscription_scope_check;

alter table public.athlete_subscription
  add constraint athlete_subscription_subscription_scope_check
  check (subscription_scope in (
    'athlete_track',
    'staff_coach',
    'staff_programmer',
    'staff_admin'
  ));

comment on column public.athlete_subscription.subscription_scope is
  'athlete_track = access programming for that library; staff_* = library-scoped staff role for Coach / Programmer / Admin.';

create index if not exists athlete_subscription_scope_idx
  on public.athlete_subscription (contact_id, gym_id, program_library_id, subscription_scope)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- 3. programming_line_item: completion timestamp (athlete "completed date")
-- ---------------------------------------------------------------------------
alter table public.programming_line_item
  add column if not exists completed_at timestamptz;

comment on column public.programming_line_item.completed_at is
  'When the athlete marked the line item completed (optional; distinct from updated_at).';

-- ============================================================================
-- Helper functions (auth contact + capability checks)
-- ============================================================================

create or replace function public.auth_contact_id ()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select c.id
  from public.contact c
  where c.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_active_fm_role (
  p_gym_id uuid,
  p_role text
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.fitness_membership fm
    where fm.contact_id = public.auth_contact_id()
      and fm.gym_id = p_gym_id
      and fm.role = p_role
      and fm.membership_status = 'active'
  );
$$;

create or replace function public.has_active_fm_any (
  p_gym_id uuid,
  p_roles text[]
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.fitness_membership fm
    where fm.contact_id = public.auth_contact_id()
      and fm.gym_id = p_gym_id
      and fm.membership_status = 'active'
      and fm.role = any (p_roles)
  );
$$;

create or replace function public.has_athlete_track_access (
  p_gym_id uuid,
  p_program_library_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.athlete_subscription s
    where s.contact_id = public.auth_contact_id()
      and s.gym_id = p_gym_id
      and s.status = 'active'
      and s.subscription_scope = 'athlete_track'
      and (
        s.program_library_id is null
        or p_program_library_id is null
        or s.program_library_id = p_program_library_id
      )
  );
$$;

create or replace function public.has_staff_library_scope (
  p_gym_id uuid,
  p_program_library_id uuid,
  p_scope text
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.athlete_subscription s
    where s.contact_id = public.auth_contact_id()
      and s.gym_id = p_gym_id
      and s.status = 'active'
      and s.subscription_scope = p_scope
      and (
        s.program_library_id is null
        or p_program_library_id is null
        or s.program_library_id = p_program_library_id
      )
  );
$$;

-- Admin membership + staff_admin library subscription for the same gym (required pair).
create or replace function public.is_gym_admin_scoped (p_gym_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.fitness_membership fm
    join public.athlete_subscription s
      on s.contact_id = fm.contact_id
     and s.gym_id = fm.gym_id
    where fm.contact_id = public.auth_contact_id()
      and fm.gym_id = p_gym_id
      and fm.role = 'admin'
      and fm.membership_status = 'active'
      and s.status = 'active'
      and s.subscription_scope = 'staff_admin'
  );
$$;

-- Any gym where the user is admin + staff_admin (global benchmark edits, etc.).
create or replace function public.auth_is_staff_admin_anywhere ()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.gym g
    where public.is_gym_admin_scoped (g.id)
  );
$$;

-- Gym-level staff entitlement (used when creating a new program_library before a row-specific subscription exists).
create or replace function public.has_gym_staff_entitlement (
  p_gym_id uuid,
  p_scope text
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.athlete_subscription s
    where s.contact_id = public.auth_contact_id()
      and s.gym_id = p_gym_id
      and s.status = 'active'
      and s.subscription_scope = p_scope
  );
$$;

-- Gyms the user can see (any active membership role).
create or replace function public.user_gym_ids ()
  returns setof uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select fm.gym_id
  from public.fitness_membership fm
  where fm.contact_id = public.auth_contact_id()
    and fm.membership_status = 'active';
$$;

-- Legacy helper kept for policies that referenced it (now implemented via auth_contact_id).
create or replace function public.user_contact_id ()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select public.auth_contact_id ();
$$;

-- ============================================================================
-- DROP existing RLS policies (replace with persona-aware set)
-- ============================================================================

drop policy if exists gym_select on public.gym;
drop policy if exists gym_insert on public.gym;
drop policy if exists gym_update on public.gym;

drop policy if exists contact_select_own on public.contact;
drop policy if exists contact_select_gym on public.contact;
drop policy if exists contact_insert on public.contact;
drop policy if exists contact_update_own on public.contact;
drop policy if exists contact_update_self on public.contact;
drop policy if exists contact_update_admin on public.contact;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;

drop policy if exists onboarding_insert on public.gym_onboarding_request;
drop policy if exists onboarding_select on public.gym_onboarding_request;
drop policy if exists onboarding_update on public.gym_onboarding_request;

drop policy if exists program_library_select on public.program_library;
drop policy if exists program_library_insert on public.program_library;
drop policy if exists program_library_update on public.program_library;

drop policy if exists fitness_membership_select on public.fitness_membership;
drop policy if exists fitness_membership_insert on public.fitness_membership;
drop policy if exists fitness_membership_update on public.fitness_membership;

drop policy if exists athlete_subscription_select on public.athlete_subscription;
drop policy if exists athlete_subscription_insert on public.athlete_subscription;
drop policy if exists athlete_subscription_update on public.athlete_subscription;

drop policy if exists benchmark_type_select on public.benchmark_type;
drop policy if exists benchmark_definition_select on public.benchmark_definition;

drop policy if exists programming_select on public.programming;
drop policy if exists programming_insert on public.programming;
drop policy if exists programming_update on public.programming;

drop policy if exists pli_select on public.programming_line_item;
drop policy if exists pli_insert on public.programming_line_item;
drop policy if exists pli_update on public.programming_line_item;

drop policy if exists athlete_performance_select on public.athlete_performance;
drop policy if exists athlete_performance_insert on public.athlete_performance;
drop policy if exists athlete_performance_update on public.athlete_performance;

drop policy if exists athlete_benchmark_summary_select on public.athlete_benchmark_summary;
drop policy if exists athlete_benchmark_summary_insert on public.athlete_benchmark_summary;
drop policy if exists athlete_benchmark_summary_update on public.athlete_benchmark_summary;

-- ============================================================================
-- gym
-- ============================================================================

create policy gym_select on public.gym
  for select using (id in (select public.user_gym_ids()));

create policy gym_insert on public.gym
  for insert to authenticated with check (true);

create policy gym_update on public.gym
  for update using (public.is_gym_admin_scoped (id))
  with check (public.is_gym_admin_scoped (id));

-- ============================================================================
-- contact
-- ============================================================================

create policy contact_select_own on public.contact
  for select using (user_id = auth.uid());

create policy contact_select_gym on public.contact
  for select using (
    id in (
      select fm.contact_id
      from public.fitness_membership fm
      where fm.gym_id in (select public.user_gym_ids ())
    )
  );

create policy contact_insert on public.contact
  for insert to authenticated with check (true);

create policy contact_update_self on public.contact
  for update using (user_id = auth.uid ())
  with check (user_id = auth.uid ());

create policy contact_update_admin on public.contact
  for update using (
    exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = contact.id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  )
  with check (
    exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = contact.id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

-- ============================================================================
-- profiles
-- ============================================================================

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid ()
    or exists (
      select 1
      from public.contact c
      join public.fitness_membership fm on fm.contact_id = c.id
      where c.id = profiles.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid ());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid ())
  with check (id = auth.uid ());

create policy profiles_update_admin on public.profiles
  for update using (
    exists (
      select 1
      from public.contact c
      join public.fitness_membership fm on fm.contact_id = c.id
      where c.id = profiles.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  )
  with check (
    exists (
      select 1
      from public.contact c
      join public.fitness_membership fm on fm.contact_id = c.id
      where c.id = profiles.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

-- ============================================================================
-- gym_onboarding_request (admin write; broad read for participants)
-- ============================================================================

create policy onboarding_select on public.gym_onboarding_request
  for select using (
    created_contact_id = public.auth_contact_id ()
    or created_account_id in (select public.user_gym_ids ())
    or public.auth_is_staff_admin_anywhere ()
  );

create policy onboarding_insert on public.gym_onboarding_request
  for insert to authenticated with check (true);

create policy onboarding_update on public.gym_onboarding_request
  for update using (
    created_contact_id = public.auth_contact_id ()
    or (
      created_account_id is not null
      and public.is_gym_admin_scoped (created_account_id)
    )
  )
  with check (
    created_contact_id = public.auth_contact_id ()
    or (
      created_account_id is not null
      and public.is_gym_admin_scoped (created_account_id)
    )
  );

-- ============================================================================
-- program_library
-- ============================================================================

create policy program_library_select on public.program_library
  for select using (gym_id in (select public.user_gym_ids ()));

create policy program_library_insert on public.program_library
  for insert with check (
    gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_gym_staff_entitlement (gym_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and public.has_gym_staff_entitlement (gym_id, 'staff_admin')
      )
    )
  );

create policy program_library_update on public.program_library
  for update using (
    gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and public.has_staff_library_scope (gym_id, id, 'staff_admin')
      )
    )
  )
  with check (
    gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and public.has_staff_library_scope (gym_id, id, 'staff_admin')
      )
    )
  );

-- ============================================================================
-- fitness_membership (read gym members; write admin only)
-- ============================================================================

create policy fitness_membership_select on public.fitness_membership
  for select using (gym_id in (select public.user_gym_ids ()));

create policy fitness_membership_insert on public.fitness_membership
  for insert with check (
    public.is_gym_admin_scoped (gym_id)
  );

create policy fitness_membership_update on public.fitness_membership
  for update using (public.is_gym_admin_scoped (gym_id))
  with check (public.is_gym_admin_scoped (gym_id));

-- ============================================================================
-- athlete_subscription (read members; write admin only)
-- ============================================================================

create policy athlete_subscription_select on public.athlete_subscription
  for select using (
    contact_id = public.auth_contact_id ()
    or gym_id in (select public.user_gym_ids ())
  );

create policy athlete_subscription_insert on public.athlete_subscription
  for insert with check (public.is_gym_admin_scoped (gym_id));

create policy athlete_subscription_update on public.athlete_subscription
  for update using (public.is_gym_admin_scoped (gym_id))
  with check (public.is_gym_admin_scoped (gym_id));

-- ============================================================================
-- benchmark_type / benchmark_definition
-- ============================================================================

create policy benchmark_type_select on public.benchmark_type
  for select to authenticated using (true);

create policy benchmark_type_insert on public.benchmark_type
  for insert with check (public.auth_is_staff_admin_anywhere ());

create policy benchmark_type_update on public.benchmark_type
  for update using (public.auth_is_staff_admin_anywhere ())
  with check (public.auth_is_staff_admin_anywhere ());

create policy benchmark_definition_select on public.benchmark_definition
  for select to authenticated using (true);

create policy benchmark_definition_insert on public.benchmark_definition
  for insert with check (public.auth_is_staff_admin_anywhere ());

create policy benchmark_definition_update on public.benchmark_definition
  for update using (public.auth_is_staff_admin_anywhere ())
  with check (public.auth_is_staff_admin_anywhere ());

-- ============================================================================
-- programming (insert programmer/admin; update via trigger + narrow policies)
-- ============================================================================

create policy programming_select on public.programming
  for select using (gym_id in (select public.user_gym_ids ()));

create policy programming_insert on public.programming
  for insert with check (
    gym_id in (select public.user_gym_ids ())
    and program_library_id is not null
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
      )
    )
  );

create policy programming_update on public.programming
  for update using (gym_id in (select public.user_gym_ids ()))
  with check (gym_id in (select public.user_gym_ids ()));

-- ============================================================================
-- programming_line_item
-- ============================================================================

create policy pli_select on public.programming_line_item
  for select using (
    exists (
      select 1 from public.programming p
      where p.id = programming_line_item.programming_id
        and p.gym_id in (select public.user_gym_ids ())
    )
  );

create policy pli_insert on public.programming_line_item
  for insert with check (
    exists (
      select 1 from public.programming p
      where p.id = programming_line_item.programming_id
        and p.gym_id in (select public.user_gym_ids ())
        and (
          (
            p.program_library_id is not null
            and (
              (
                public.has_active_fm_role (p.gym_id, 'programmer')
                and public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_programmer')
              )
              or (
                public.has_active_fm_role (p.gym_id, 'admin')
                and public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_admin')
              )
            )
          )
          or (
            p.program_library_id is null
            and (
              (
                public.has_active_fm_role (p.gym_id, 'programmer')
                and public.has_gym_staff_entitlement (p.gym_id, 'staff_programmer')
              )
              or (
                public.has_active_fm_role (p.gym_id, 'admin')
                and public.has_gym_staff_entitlement (p.gym_id, 'staff_admin')
              )
            )
          )
        )
    )
  );

create policy pli_update on public.programming_line_item
  for update using (
    exists (
      select 1 from public.programming p
      where p.id = programming_line_item.programming_id
        and p.gym_id in (select public.user_gym_ids ())
    )
  )
  with check (
    exists (
      select 1 from public.programming p
      where p.id = programming_line_item.programming_id
        and p.gym_id in (select public.user_gym_ids ())
    )
  );

-- ============================================================================
-- athlete_performance
-- ============================================================================

create policy athlete_performance_select on public.athlete_performance
  for select using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and fm.gym_id in (select public.user_gym_ids ())
    )
  );

create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    (
      contact_id = public.auth_contact_id ()
      and exists (
        select 1 from public.fitness_membership fm
        where fm.contact_id = athlete_performance.contact_id
          and fm.role = 'athlete'
          and fm.membership_status = 'active'
          and (
            athlete_performance.programming_id is null
            or fm.gym_id = (
              select p.gym_id
              from public.programming p
              where p.id = athlete_performance.programming_id
            )
          )
      )
    )
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

create policy athlete_performance_update on public.athlete_performance
  for update using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  )
  with check (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

-- ============================================================================
-- athlete_benchmark_summary
-- ============================================================================

create policy athlete_benchmark_summary_select on public.athlete_benchmark_summary
  for select using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and fm.gym_id in (select public.user_gym_ids ())
    )
  );

create policy athlete_benchmark_summary_insert on public.athlete_benchmark_summary
  for insert with check (
    (
      contact_id = public.auth_contact_id ()
      and exists (
        select 1 from public.fitness_membership fm
        where fm.contact_id = public.auth_contact_id ()
          and fm.role = 'athlete'
          and fm.membership_status = 'active'
      )
    )
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

create policy athlete_benchmark_summary_update on public.athlete_benchmark_summary
  for update using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  )
  with check (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

-- ============================================================================
-- TRIGGERS: column-level update enforcement
-- ============================================================================

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

drop trigger if exists programming_update_guard on public.programming;

create trigger programming_update_guard
  before update on public.programming
  for each row execute procedure public.trg_enforce_programming_update ();

create or replace function public.trg_enforce_pli_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_lib uuid;
  v_prog_ok boolean;
  v_coach_ok boolean;
  v_admin_ok boolean;
  v_athlete_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  select p.gym_id, p.program_library_id into v_gym, v_lib
  from public.programming p
  where p.id = new.programming_id;

  if v_gym is null then
    raise exception 'Invalid programming_id on programming_line_item';
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

  v_athlete_ok :=
    public.has_active_fm_role (v_gym, 'athlete')
    and public.has_athlete_track_access (v_gym, v_lib)
    and new.contact_id = public.auth_contact_id ();

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
    raise exception 'Athletes may only update results fields on programming_line_item';
  end if;

  raise exception 'Insufficient privileges to update programming_line_item';
end;
$$;

drop trigger if exists pli_update_guard on public.programming_line_item;

create trigger pli_update_guard
  before update on public.programming_line_item
  for each row execute procedure public.trg_enforce_pli_update ();
