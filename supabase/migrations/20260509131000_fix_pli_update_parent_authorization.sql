-- ============================================================================
-- Fix PLI update authorization: check the existing parent before allowing edits.
-- Prevents athletes (or staff with access only to the destination) from
-- re-parenting shared class line items into a session they control.
-- ============================================================================

create or replace function public.trg_enforce_pli_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_old_gym uuid;
  v_old_lib uuid;
  v_old_author uuid;
  v_old_source text;
  v_new_gym uuid;
  v_new_lib uuid;
  v_new_author uuid;
  v_new_source text;
  v_same_programming boolean := old.programming_id = new.programming_id;
  v_old_prog_ok boolean;
  v_new_prog_ok boolean;
  v_old_coach_ok boolean;
  v_new_coach_ok boolean;
  v_old_admin_ok boolean;
  v_new_admin_ok boolean;
  v_athlete_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_old_gym, v_old_lib, v_old_author, v_old_source
  from public.programming p
  where p.id = old.programming_id;

  if not found then
    raise exception 'Invalid existing programming_id on programming_line_item';
  end if;

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_new_gym, v_new_lib, v_new_author, v_new_source
  from public.programming p
  where p.id = new.programming_id;

  if not found then
    raise exception 'Invalid new programming_id on programming_line_item';
  end if;

  if v_same_programming
     and v_old_author = public.auth_contact_id ()
     and v_new_author = public.auth_contact_id ()
     and v_old_source = 'athlete_custom'
     and v_new_source = 'athlete_custom'
  then
    return new;
  end if;

  if v_old_gym is null then
    raise exception 'Insufficient privileges to update programming_line_item';
  end if;

  v_old_prog_ok :=
    public.has_active_fm_role (v_old_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_programmer')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_programmer')
      )
    );

  v_new_prog_ok :=
    public.has_active_fm_role (v_new_gym, 'programmer')
    and (
      public.has_staff_library_scope (v_new_gym, v_new_lib, 'staff_programmer')
      or (
        v_new_lib is null
        and public.has_gym_staff_entitlement (v_new_gym, 'staff_programmer')
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

  v_new_admin_ok :=
    public.has_active_fm_role (v_new_gym, 'admin')
    and (
      public.has_staff_library_scope (v_new_gym, v_new_lib, 'staff_admin')
      or (
        v_new_lib is null
        and public.has_gym_staff_entitlement (v_new_gym, 'staff_admin')
      )
    );

  if (v_old_prog_ok or v_old_admin_ok)
     and (
       v_same_programming
       or v_new_prog_ok
       or v_new_admin_ok
     )
  then
    return new;
  end if;

  v_old_coach_ok :=
    public.has_active_fm_role (v_old_gym, 'coach')
    and (
      public.has_staff_library_scope (v_old_gym, v_old_lib, 'staff_coach')
      or (
        v_old_lib is null
        and public.has_gym_staff_entitlement (v_old_gym, 'staff_coach')
      )
    );

  v_new_coach_ok :=
    public.has_active_fm_role (v_new_gym, 'coach')
    and (
      public.has_staff_library_scope (v_new_gym, v_new_lib, 'staff_coach')
      or (
        v_new_lib is null
        and public.has_gym_staff_entitlement (v_new_gym, 'staff_coach')
      )
    );

  if v_old_coach_ok
     and (
       v_same_programming
       or v_new_coach_ok
     )
  then
    return new;
  end if;

  if old.contact_id is null then
    raise exception 'Log class results in athlete_performance (shared line item); do not update this row';
  end if;

  v_athlete_ok :=
    public.has_active_fm_role (v_old_gym, 'athlete')
    and public.has_athlete_track_access (v_old_gym, v_old_lib)
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
