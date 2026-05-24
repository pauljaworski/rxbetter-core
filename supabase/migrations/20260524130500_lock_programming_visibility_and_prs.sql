-- Lock high-risk programming visibility/update paths introduced by publish + athlete custom flows.

-- Staff can read draft programming; athletes only receive published gym programming.
create or replace function public.can_staff_read_programming (
  p_gym_id uuid,
  p_program_library_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select p_gym_id is not null
    and (
      (
        public.has_active_fm_role (p_gym_id, 'coach')
        and (
          public.has_staff_library_scope (p_gym_id, p_program_library_id, 'staff_coach')
          or public.has_gym_staff_entitlement (p_gym_id, 'staff_coach')
        )
      )
      or (
        public.has_active_fm_role (p_gym_id, 'programmer')
        and (
          public.has_staff_library_scope (p_gym_id, p_program_library_id, 'staff_programmer')
          or public.has_gym_staff_entitlement (p_gym_id, 'staff_programmer')
        )
      )
      or (
        public.has_active_fm_role (p_gym_id, 'admin')
        and (
          public.has_staff_library_scope (p_gym_id, p_program_library_id, 'staff_admin')
          or public.has_gym_staff_entitlement (p_gym_id, 'staff_admin')
        )
      )
    );
$$;

drop policy if exists programming_select on public.programming;
create policy programming_select on public.programming
  for select using (
    created_by_contact_id = public.auth_contact_id ()
    or (
      gym_id is not null
      and gym_id in (select public.user_gym_ids ())
      and (
        public.can_staff_read_programming (gym_id, program_library_id)
        or (
          source = 'gym'
          and published_at is not null
        )
      )
    )
  );

drop policy if exists pli_select on public.programming_line_item;
create policy pli_select on public.programming_line_item
  for select using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and (
          p.created_by_contact_id = public.auth_contact_id ()
          or (
            p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
            and (
              public.can_staff_read_programming (p.gym_id, p.program_library_id)
              or (
                p.source = 'gym'
                and p.published_at is not null
              )
            )
          )
        )
    )
  );

drop policy if exists pli_delete on public.programming_line_item;
create policy pli_delete on public.programming_line_item
  for delete using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.gym_id in (select public.user_gym_ids ())
        and (
          (
            public.has_active_fm_role (p.gym_id, 'programmer')
            and (
              public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_programmer')
              or public.has_gym_staff_entitlement (p.gym_id, 'staff_programmer')
            )
          )
          or (
            public.has_active_fm_role (p.gym_id, 'admin')
            and (
              public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_admin')
              or public.has_gym_staff_entitlement (p.gym_id, 'staff_admin')
            )
          )
        )
    )
  );

drop policy if exists pla_select on public.programming_library_assignment;
create policy pla_select on public.programming_library_assignment
  for select using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_library_assignment.programming_id
        and (
          p.created_by_contact_id = public.auth_contact_id ()
          or (
            p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
            and (
              public.can_staff_read_programming (p.gym_id, p.program_library_id)
              or (
                p.source = 'gym'
                and p.published_at is not null
              )
            )
          )
        )
    )
  );

drop policy if exists programming_intake_stage_select on public.programming_intake_stage;
create policy programming_intake_stage_select on public.programming_intake_stage
  for select using (
    gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and (
          public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
          or public.has_gym_staff_entitlement (gym_id, 'staff_admin')
        )
      )
    )
  );

-- Athletes may log against published gym WODs or their own athlete_custom sessions, never drafts.
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
                    p.gym_id = fm.gym_id
                    and p.source = 'gym'
                    and p.published_at is not null
                  )
                  or (
                    p.source = 'athlete_custom'
                    and p.created_by_contact_id = public.auth_contact_id ()
                    and (
                      p.gym_id is null
                      or p.gym_id = fm.gym_id
                    )
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
       and new.source = old.source
       and new.gym_id is not distinct from old.gym_id
       and new.published_at is null
       and (
         new.program_library_id is null
         or new.gym_id is null
         or public.has_athlete_track_access (new.gym_id, new.program_library_id)
       )
    then
      return new;
    end if;

    raise exception 'Athlete custom programming cannot be promoted or repointed';
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
