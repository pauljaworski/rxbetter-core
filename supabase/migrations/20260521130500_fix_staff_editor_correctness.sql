-- Fix staff editor correctness regressions from the Supabase-backed staff UI.
-- Coaches should be able to correct class scores for their gym/library, and
-- the programming editor must persist the segment/format values it exposes.

-- ---------------------------------------------------------------------------
-- 1. Align programming constraints with the staff editor's Coach Dashboard UX.
-- ---------------------------------------------------------------------------
alter table public.programming
  drop constraint if exists programming_programming_segment_check;

alter table public.programming
  add constraint programming_programming_segment_check
  check (
    programming_segment is null
    or programming_segment in (
      'warmup',
      'skill',
      'strength',
      'weightlifting',
      'metcon',
      'bodyweight',
      'accessory',
      'cooldown'
    )
  );

alter table public.programming
  drop constraint if exists programming_metcon_format_check;

alter table public.programming
  add constraint programming_metcon_format_check
  check (
    metcon_format is null
    or metcon_format in (
      'amrap',
      'chipper',
      'emom',
      'for_time',
      'rft',
      'tabata'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Allow entitled coaches to correct athlete performance for class WODs.
-- ---------------------------------------------------------------------------
drop policy if exists athlete_performance_update on public.athlete_performance;

create policy athlete_performance_update on public.athlete_performance
  for update using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
    or exists (
      select 1
      from public.programming p
      join public.fitness_membership athlete_fm
        on athlete_fm.contact_id = athlete_performance.contact_id
       and athlete_fm.gym_id = p.gym_id
       and athlete_fm.membership_status = 'active'
      where p.id = athlete_performance.programming_id
        and p.gym_id is not null
        and public.has_active_fm_role (p.gym_id, 'coach')
        and (
          public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_coach')
          or (
            p.program_library_id is null
            and public.has_gym_staff_entitlement (p.gym_id, 'staff_coach')
          )
        )
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
    or exists (
      select 1
      from public.programming p
      join public.fitness_membership athlete_fm
        on athlete_fm.contact_id = athlete_performance.contact_id
       and athlete_fm.gym_id = p.gym_id
       and athlete_fm.membership_status = 'active'
      where p.id = athlete_performance.programming_id
        and p.gym_id is not null
        and public.has_active_fm_role (p.gym_id, 'coach')
        and (
          public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_coach')
          or (
            p.program_library_id is null
            and public.has_gym_staff_entitlement (p.gym_id, 'staff_coach')
          )
        )
    )
  );

create or replace function public.trg_enforce_athlete_performance_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_lib uuid;
  v_coach_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if old.contact_id = public.auth_contact_id ()
     and new.contact_id = old.contact_id
  then
    return new;
  end if;

  if exists (
    select 1
    from public.fitness_membership fm
    where fm.contact_id = old.contact_id
      and public.is_gym_admin_scoped (fm.gym_id)
  ) then
    return new;
  end if;

  select p.gym_id, p.program_library_id
    into v_gym, v_lib
  from public.programming p
  where p.id = old.programming_id;

  v_coach_ok :=
    v_gym is not null
    and public.has_active_fm_role (v_gym, 'coach')
    and exists (
      select 1
      from public.fitness_membership athlete_fm
      where athlete_fm.contact_id = old.contact_id
        and athlete_fm.gym_id = v_gym
        and athlete_fm.membership_status = 'active'
    )
    and (
      public.has_staff_library_scope (v_gym, v_lib, 'staff_coach')
      or (
        v_lib is null
        and public.has_gym_staff_entitlement (v_gym, 'staff_coach')
      )
    );

  if v_coach_ok then
    if (to_jsonb (new) - 'score' - 'weight_lifted' - 'result_value' - 'rpe' - 'updated_at')
       = (to_jsonb (old) - 'score' - 'weight_lifted' - 'result_value' - 'rpe' - 'updated_at')
    then
      return new;
    end if;

    raise exception 'Coaches may only correct class score fields';
  end if;

  return new;
end;
$$;

drop trigger if exists athlete_performance_staff_update_guard_trg on public.athlete_performance;

create trigger athlete_performance_staff_update_guard_trg
  before update on public.athlete_performance
  for each row execute procedure public.trg_enforce_athlete_performance_update ();

-- ---------------------------------------------------------------------------
-- 3. Let entitled programmers/admins persist deletions from the editor.
-- ---------------------------------------------------------------------------
drop policy if exists programming_delete on public.programming;

create policy programming_delete on public.programming
  for delete using (
    source = 'gym'
    and gym_id is not null
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and (
          public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
          or (
            program_library_id is null
            and public.has_gym_staff_entitlement (gym_id, 'staff_programmer')
          )
        )
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and (
          public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
          or (
            program_library_id is null
            and public.has_gym_staff_entitlement (gym_id, 'staff_admin')
          )
        )
      )
    )
  );

drop policy if exists pli_delete on public.programming_line_item;

create policy pli_delete on public.programming_line_item
  for delete using (
    contact_id is null
    and exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.source = 'gym'
        and p.gym_id is not null
        and (
          (
            public.has_active_fm_role (p.gym_id, 'programmer')
            and (
              public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_programmer')
              or (
                p.program_library_id is null
                and public.has_gym_staff_entitlement (p.gym_id, 'staff_programmer')
              )
            )
          )
          or (
            public.has_active_fm_role (p.gym_id, 'admin')
            and (
              public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_admin')
              or (
                p.program_library_id is null
                and public.has_gym_staff_entitlement (p.gym_id, 'staff_admin')
              )
            )
          )
        )
    )
  );
