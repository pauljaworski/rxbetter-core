-- Lock draft programming/intake visibility and restore safe delete paths.

-- Existing historical class programming pre-dated the publish workflow. Keep
-- past/today gym WODs visible while future saved segments remain drafts.
update public.programming
set published_at = coalesce(updated_at, created_at, now())
where published_at is null
  and coalesce(source, 'gym') = 'gym'
  and wod_date <= current_date;

create or replace function public.has_programming_staff_access (
  p_gym_id uuid,
  p_program_library_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.has_active_fm_role (p_gym_id, 'programmer')
    and (
      public.has_staff_library_scope (p_gym_id, p_program_library_id, 'staff_programmer')
      or (
        p_program_library_id is null
        and public.has_gym_staff_entitlement (p_gym_id, 'staff_programmer')
      )
    )
  )
  or (
    public.has_active_fm_role (p_gym_id, 'admin')
    and (
      public.has_staff_library_scope (p_gym_id, p_program_library_id, 'staff_admin')
      or (
        p_program_library_id is null
        and public.has_gym_staff_entitlement (p_gym_id, 'staff_admin')
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
        public.has_programming_staff_access (gym_id, program_library_id)
        or (
          coalesce(source, 'gym') = 'gym'
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
              public.has_programming_staff_access (p.gym_id, p.program_library_id)
              or (
                coalesce(p.source, 'gym') = 'gym'
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
    and public.has_programming_staff_access (gym_id, program_library_id)
  );

drop policy if exists pli_delete on public.programming_line_item;

create policy pli_delete on public.programming_line_item
  for delete using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and (
          (
            p.created_by_contact_id = public.auth_contact_id ()
            and p.source = 'athlete_custom'
          )
          or (
            p.gym_id is not null
            and p.gym_id in (select public.user_gym_ids ())
            and public.has_programming_staff_access (p.gym_id, p.program_library_id)
          )
        )
    )
  );

drop policy if exists athlete_performance_delete on public.athlete_performance;

create policy athlete_performance_delete on public.athlete_performance
  for delete using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

drop policy if exists athlete_benchmark_summary_delete on public.athlete_benchmark_summary;

create policy athlete_benchmark_summary_delete on public.athlete_benchmark_summary
  for delete using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );
