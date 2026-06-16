-- ============================================================================
-- Lock update guards to the existing tenant/programming scope.
--
-- The broad RLS update policies intentionally expose rows to gym members so the
-- trigger can enforce persona-specific edits. These guards must authorize
-- against OLD row scope; otherwise a caller can change gym/library/parent ids to
-- a scope they can write and bypass the original row's permissions.
-- ============================================================================

create or replace function public.trg_enforce_programming_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_old_lib uuid := old.program_library_id;
  v_new_lib uuid := new.program_library_id;
  v_old_gym uuid := old.gym_id;
  v_new_gym uuid := new.gym_id;
  v_prog_old_ok boolean;
  v_prog_new_ok boolean;
  v_coach_ok boolean;
  v_admin_old_ok boolean;
  v_admin_new_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if new.created_by_contact_id = public.auth_contact_id ()
     and old.created_by_contact_id = public.auth_contact_id ()
     and old.source = 'athlete_custom'
     and new.source = 'athlete_custom'
  then
    return new;
  end if;

  if v_old_gym is null then
    raise exception 'Insufficient privileges to update programming';
  end if;

  if v_old_gym is distinct from v_new_gym then
    raise exception 'Programming gym_id cannot be changed';
  end if;

  v_prog_old_ok :=
    public.has_active_fm_role (v_old_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_programmer')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_programmer')
      )
    );

  v_prog_new_ok :=
    public.has_active_fm_role (v_new_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_new_gym, v_new_lib, 'staff_programmer')
      or (
        v_new_lib is null
        and public.has_gym_staff_entitlement (v_new_gym, 'staff_programmer')
      )
    );

  v_admin_old_ok :=
    public.has_active_fm_role (v_old_gym, 'admin')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_admin')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_admin')
      )
    );

  v_admin_new_ok :=
    public.has_active_fm_role (v_new_gym, 'admin')
    and (
      public.has_staff_library_scope (v_new_gym, v_new_lib, 'staff_admin')
      or (
        v_new_lib is null
        and public.has_gym_staff_entitlement (v_new_gym, 'staff_admin')
      )
    );

  if (v_prog_old_ok and v_prog_new_ok) or (v_admin_old_ok and v_admin_new_ok) then
    return new;
  end if;

  v_coach_ok :=
    public.has_active_fm_role (v_old_gym, 'coach')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_coach')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_coach')
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
  v_prog_ok boolean;
  v_coach_ok boolean;
  v_admin_ok boolean;
  v_athlete_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if old.programming_id is distinct from new.programming_id then
    raise exception 'programming_line_item programming_id cannot be changed';
  end if;

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_gym, v_lib, v_author, v_source
  from public.programming p
  where p.id = old.programming_id;

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
