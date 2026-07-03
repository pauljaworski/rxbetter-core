-- Keep athlete-authored personal WODs athlete-owned. Gym programming surfaces
-- should only read/write staff-authored rows, even when personal rows carry gym_id.

drop policy if exists programming_select on public.programming;
drop policy if exists programming_insert on public.programming;
drop policy if exists programming_update on public.programming;

create policy programming_select on public.programming
  for select using (
    (
      source = 'gym'
      and gym_id is not null
      and gym_id in (select public.user_gym_ids ())
    )
    or (
      source = 'athlete_custom'
      and created_by_contact_id = public.auth_contact_id ()
    )
  );

create policy programming_insert on public.programming
  for insert with check (
    source = 'gym'
    and gym_id in (select public.user_gym_ids ())
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
  for update using (
    (
      source = 'gym'
      and gym_id is not null
      and gym_id in (select public.user_gym_ids ())
    )
    or (
      source = 'athlete_custom'
      and created_by_contact_id = public.auth_contact_id ()
    )
  )
  with check (
    (
      source = 'gym'
      and gym_id is not null
      and gym_id in (select public.user_gym_ids ())
    )
    or (
      source = 'athlete_custom'
      and created_by_contact_id = public.auth_contact_id ()
      and program_library_id is null
    )
  );

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
            p.source = 'gym'
            and p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
          )
          or (
            p.source = 'athlete_custom'
            and p.created_by_contact_id = public.auth_contact_id ()
          )
        )
    )
  );

create policy pli_insert on public.programming_line_item
  for insert with check (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.source = 'gym'
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
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and (
          (
            p.source = 'gym'
            and p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
          )
          or (
            p.source = 'athlete_custom'
            and p.created_by_contact_id = public.auth_contact_id ()
          )
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
            p.source = 'gym'
            and p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
          )
          or (
            p.source = 'athlete_custom'
            and p.created_by_contact_id = public.auth_contact_id ()
          )
        )
    )
  );

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

  if old.source = 'athlete_custom' or new.source = 'athlete_custom' then
    if old.source = 'athlete_custom'
       and new.source = 'athlete_custom'
       and old.created_by_contact_id = public.auth_contact_id ()
       and new.created_by_contact_id = old.created_by_contact_id
       and new.gym_id is not distinct from old.gym_id
       and new.program_library_id is null
    then
      return new;
    end if;

    raise exception 'Only the owning athlete may update personal programming';
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
  v_old_author uuid;
  v_old_source text;
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

  select p.created_by_contact_id, p.source
    into v_old_author, v_old_source
  from public.programming p
  where p.id = old.programming_id;

  if not found then
    raise exception 'Invalid original programming_id on programming_line_item';
  end if;

  if v_old_source = 'athlete_custom' or v_source = 'athlete_custom' then
    if v_old_source = 'athlete_custom'
       and v_source = 'athlete_custom'
       and v_old_author = public.auth_contact_id ()
       and v_author = public.auth_contact_id ()
    then
      return new;
    end if;

    raise exception 'Only the owning athlete may update personal programming movements';
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
  end if;

  raise exception 'Insufficient privileges to update programming_line_item';
end;
$$;
