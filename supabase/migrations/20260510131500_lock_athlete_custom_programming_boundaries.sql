-- ============================================================================
-- Lock athlete-custom programming boundaries.
--
-- Prevent athletes from reparenting shared gym line items into personal sessions
-- and from upgrading personal sessions into gym-authored programming via the
-- athlete owner fast-path.
-- ============================================================================

-- Athlete-custom rows may be personal (no gym/library) or tied to a gym track the
-- athlete can actually access. A null gym cannot carry a library reference.
drop policy if exists programming_insert_athlete_custom on public.programming;

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
      or (
        gym_id is not null
        and public.has_athlete_track_access (gym_id, program_library_id)
      )
    )
  );

-- Athlete-authored custom line items are either unassigned personal movements or
-- assigned to the author. They must not masquerade as another athlete's work.
drop policy if exists pli_insert_athlete_custom on public.programming_line_item;

create policy pli_insert_athlete_custom on public.programming_line_item
  for insert with check (
    (
      contact_id is null
      or contact_id = public.auth_contact_id ()
    )
    and exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.created_by_contact_id = public.auth_contact_id ()
        and p.source = 'athlete_custom'
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
  v_old_lib uuid := old.program_library_id;
  v_old_gym uuid := old.gym_id;
  v_prog_ok boolean;
  v_old_prog_ok boolean;
  v_coach_ok boolean;
  v_old_coach_ok boolean;
  v_admin_ok boolean;
  v_old_admin_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if new.created_by_contact_id = public.auth_contact_id ()
     and old.created_by_contact_id = public.auth_contact_id ()
     and old.source = 'athlete_custom'
     and new.source = 'athlete_custom'
     and (
       new.gym_id is null
       or (
         new.gym_id in (select public.user_gym_ids ())
         and public.has_active_fm_role (new.gym_id, 'athlete')
       )
     )
     and (
       new.program_library_id is null
       or (
         new.gym_id is not null
         and public.has_athlete_track_access (new.gym_id, new.program_library_id)
       )
     )
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

  v_old_prog_ok :=
    public.has_active_fm_role (v_old_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_programmer')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_programmer')
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

  v_old_admin_ok :=
    public.has_active_fm_role (v_old_gym, 'admin')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_admin')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_admin')
      )
    );

  if (v_prog_ok and v_old_prog_ok) or (v_admin_ok and v_old_admin_ok) then
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

  v_old_coach_ok :=
    public.has_active_fm_role (v_old_gym, 'coach')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_coach')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_coach')
      )
    );

  if v_coach_ok and v_old_coach_ok then
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
  v_old_gym uuid;
  v_old_lib uuid;
  v_old_author uuid;
  v_old_source text;
  v_prog_ok boolean;
  v_old_prog_ok boolean;
  v_coach_ok boolean;
  v_old_coach_ok boolean;
  v_admin_ok boolean;
  v_old_admin_ok boolean;
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

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_old_gym, v_old_lib, v_old_author, v_old_source
  from public.programming p
  where p.id = old.programming_id;

  if not found then
    raise exception 'Invalid previous programming_id on programming_line_item';
  end if;

  if v_author = public.auth_contact_id ()
     and v_source = 'athlete_custom'
     and v_old_author = public.auth_contact_id ()
     and v_old_source = 'athlete_custom'
     and (
       new.contact_id is null
       or new.contact_id = public.auth_contact_id ()
     )
  then
    return new;
  end if;

  if v_author = public.auth_contact_id ()
     and v_source = 'athlete_custom'
  then
    raise exception 'Athlete-custom line items must stay within athlete-owned custom programming and may only be assigned to the author';
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

  v_old_prog_ok :=
    public.has_active_fm_role (v_old_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_programmer')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_programmer')
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

  v_old_admin_ok :=
    public.has_active_fm_role (v_old_gym, 'admin')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_admin')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_admin')
      )
    );

  if (v_prog_ok and v_old_prog_ok) or (v_admin_ok and v_old_admin_ok) then
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

  v_old_coach_ok :=
    public.has_active_fm_role (v_old_gym, 'coach')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_coach')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_coach')
      )
    );

  if v_coach_ok and v_old_coach_ok then
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
