-- ============================================================================
-- Hybrid completion: class WOD results → athlete_performance (not shared PLI edits).
-- Athlete-custom programming: nullable gym_id, created_by_contact_id, source.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Schema: programming
-- ---------------------------------------------------------------------------
alter table public.programming
  alter column gym_id drop not null;

alter table public.programming
  add column if not exists created_by_contact_id uuid
    references public.contact (id) on delete set null;

alter table public.programming
  add column if not exists source text
    default 'gym';

alter table public.programming
  drop constraint if exists programming_source_check;

alter table public.programming
  add constraint programming_source_check
  check (source in ('gym', 'athlete_custom'));

update public.programming
set source = 'gym'
where source is null;

alter table public.programming
  alter column source set not null;

comment on column public.programming.gym_id is
  'Nullable for athlete-authored personal sessions outside a gym tenant.';

comment on column public.programming.created_by_contact_id is
  'Null = gym/programmer-authored; set = athlete-authored custom session.';

comment on column public.programming.source is
  'gym = staff-authored; athlete_custom = logged by athlete for solo work.';

create index if not exists programming_created_by_contact_id_idx
  on public.programming (created_by_contact_id);

create index if not exists programming_gym_wod_date_idx
  on public.programming (gym_id, wod_date desc)
  where gym_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Replace programming + PLI policies (broader select; athlete insert path)
-- ---------------------------------------------------------------------------
drop policy if exists programming_select on public.programming;
drop policy if exists programming_insert on public.programming;
drop policy if exists programming_update on public.programming;

create policy programming_select on public.programming
  for select using (
    (
      gym_id is not null
      and gym_id in (select public.user_gym_ids ())
    )
    or created_by_contact_id = public.auth_contact_id ()
  );

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

create policy programming_insert_athlete_custom on public.programming
  for insert with check (
    created_by_contact_id = public.auth_contact_id ()
    and source = 'athlete_custom'
    and (
      gym_id is null
      or (
        gym_id in (select public.user_gym_ids ())
        and public.has_active_fm_role (gym_id, 'athlete')
      )
    )
    and (
      program_library_id is null
      or gym_id is null
      or public.has_athlete_track_access (gym_id, program_library_id)
    )
  );

create policy programming_update on public.programming
  for update using (
    (
      gym_id is not null
      and gym_id in (select public.user_gym_ids ())
    )
    or created_by_contact_id = public.auth_contact_id ()
  )
  with check (
    (
      gym_id is not null
      and gym_id in (select public.user_gym_ids ())
    )
    or created_by_contact_id = public.auth_contact_id ()
  );

-- ---------------------------------------------------------------------------
-- 3. programming_line_item policies
-- ---------------------------------------------------------------------------
drop policy if exists pli_select on public.programming_line_item;
drop policy if exists pli_insert on public.programming_line_item;
drop policy if exists pli_update on public.programming_line_item;

create policy pli_select on public.programming_line_item
  for select using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and (
          (
            p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
          )
          or p.created_by_contact_id = public.auth_contact_id ()
        )
    )
  );

create policy pli_insert on public.programming_line_item
  for insert with check (
    exists (
      select 1
      from public.programming p
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

create policy pli_insert_athlete_custom on public.programming_line_item
  for insert with check (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.created_by_contact_id = public.auth_contact_id ()
        and p.source = 'athlete_custom'
    )
  );

create policy pli_update on public.programming_line_item
  for update using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and (
          (
            p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
          )
          or p.created_by_contact_id = public.auth_contact_id ()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and (
          (
            p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
          )
          or p.created_by_contact_id = public.auth_contact_id ()
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. athlete_performance insert: allow personal programming (gym_id null)
-- ---------------------------------------------------------------------------
drop policy if exists athlete_performance_insert on public.athlete_performance;

create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    (
      contact_id = public.auth_contact_id ()
      and exists (
        select 1
        from public.fitness_membership fm
        where fm.contact_id = public.auth_contact_id ()
          and fm.role = 'athlete'
          and fm.membership_status = 'active'
          and (
            athlete_performance.programming_id is null
            or exists (
              select 1
              from public.programming p
              where p.id = athlete_performance.programming_id
                and (
                  (
                    p.gym_id is not null
                    and p.gym_id = fm.gym_id
                  )
                  or (
                    p.gym_id is null
                    and p.created_by_contact_id = public.auth_contact_id ()
                  )
                )
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

-- ---------------------------------------------------------------------------
-- 5. Triggers: programming update — athlete owns row
-- ---------------------------------------------------------------------------
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

  if new.created_by_contact_id = public.auth_contact_id ()
     and old.created_by_contact_id = public.auth_contact_id ()
     and old.source = 'athlete_custom'
  then
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

-- ---------------------------------------------------------------------------
-- 6. Triggers: PLI update — block athlete edits on shared lines; allow owner session
-- ---------------------------------------------------------------------------
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
    return new;
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
