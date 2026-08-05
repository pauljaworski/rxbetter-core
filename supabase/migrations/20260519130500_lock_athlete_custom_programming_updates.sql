-- ============================================================================
-- Lock athlete-authored programming updates to the athlete_custom boundary.
--
-- The original guard trusted old.source = 'athlete_custom' for the owner fast
-- path, which let an athlete reclassify a personal session as gym programming.
-- Keep personal-session edits self-owned and athlete_custom; staff still falls
-- through to the existing staff entitlement checks below.
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

  if old.created_by_contact_id = public.auth_contact_id ()
     and old.source = 'athlete_custom'
  then
    if new.created_by_contact_id = old.created_by_contact_id
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
         or new.gym_id is null
         or public.has_athlete_track_access (new.gym_id, new.program_library_id)
       )
    then
      return new;
    end if;
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
