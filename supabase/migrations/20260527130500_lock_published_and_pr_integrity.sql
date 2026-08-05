-- Lock high-risk programming/PR paths:
-- - track-scoped staff can only manage segments in their scoped tracks
-- - published segment removal unpublishes instead of hard-deleting workout history
-- - athletes can only read/log against published programming they can access
-- - failed/cleared PR rows can be recomputed without RLS delete failures

create or replace function public.staff_can_manage_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  with target as (
    select p.id, p.gym_id
    from public.programming p
    where p.id = p_programming_id
      and p.source = 'gym'
      and p.gym_id in (select public.user_gym_ids ())
  ),
  current_libs as (
    select p.program_library_id as lib_id
    from public.programming p
    join target t on t.id = p.id
    where p.program_library_id is not null
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    join target t on t.id = pla.programming_id
  )
  select exists (
    select 1
    from target t
    where (
      exists (select 1 from current_libs)
      and not exists (
        select 1
        from current_libs cl
        where not (
          (
            public.has_active_fm_role (t.gym_id, 'programmer')
            and public.has_staff_library_scope (t.gym_id, cl.lib_id, 'staff_programmer')
          )
          or (
            public.has_active_fm_role (t.gym_id, 'admin')
            and public.has_staff_library_scope (t.gym_id, cl.lib_id, 'staff_admin')
          )
        )
      )
    )
    or (
      not exists (select 1 from current_libs)
      and (
        (
          public.has_active_fm_role (t.gym_id, 'programmer')
          and public.has_gym_staff_entitlement (t.gym_id, 'staff_programmer')
        )
        or (
          public.has_active_fm_role (t.gym_id, 'admin')
          and public.has_gym_staff_entitlement (t.gym_id, 'staff_admin')
        )
      )
    )
  );
$$;

comment on function public.staff_can_manage_programming (uuid) is
  'RLS-safe check for destructive/sync programming changes; requires manage scope for every current track assignment.';

create or replace function public.staff_can_delete_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select public.staff_can_manage_programming(p_programming_id);
$$;

comment on function public.staff_can_delete_programming (uuid) is
  'Compatibility wrapper for delete policies/RPCs; track-scoped via staff_can_manage_programming.';

create or replace function public.athlete_can_access_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  with target as (
    select p.id, p.gym_id, p.program_library_id
    from public.programming p
    where p.id = p_programming_id
      and p.source = 'gym'
      and p.published_at is not null
      and p.gym_id is not null
      and public.has_active_fm_role (p.gym_id, 'athlete')
  ),
  current_libs as (
    select t.program_library_id as lib_id
    from target t
    where t.program_library_id is not null
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    join target t on t.id = pla.programming_id
  )
  select exists (
    select 1
    from target t
    where (
      exists (select 1 from current_libs)
      and exists (
        select 1
        from current_libs cl
        where public.has_athlete_track_access (t.gym_id, cl.lib_id)
      )
    )
    or (
      not exists (select 1 from current_libs)
      and public.has_athlete_track_access (t.gym_id, null)
    )
  );
$$;

comment on function public.athlete_can_access_programming (uuid) is
  'True when the current athlete can see this published programming segment through one of their tracks.';

create or replace function public.can_select_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  with target as (
    select p.id, p.gym_id, p.source, p.created_by_contact_id, p.program_library_id
    from public.programming p
    where p.id = p_programming_id
  ),
  current_libs as (
    select t.program_library_id as lib_id
    from target t
    where t.program_library_id is not null
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    join target t on t.id = pla.programming_id
  )
  select exists (
    select 1
    from target t
    where t.created_by_contact_id = public.auth_contact_id ()
      or public.athlete_can_access_programming(t.id)
      or (
        t.source = 'gym'
        and t.gym_id is not null
        and (
          (
            exists (select 1 from current_libs)
            and exists (
              select 1
              from current_libs cl
              where (
                public.has_active_fm_role (t.gym_id, 'programmer')
                and public.has_staff_library_scope (t.gym_id, cl.lib_id, 'staff_programmer')
              )
              or (
                public.has_active_fm_role (t.gym_id, 'admin')
                and public.has_staff_library_scope (t.gym_id, cl.lib_id, 'staff_admin')
              )
              or (
                public.has_active_fm_role (t.gym_id, 'coach')
                and public.has_staff_library_scope (t.gym_id, cl.lib_id, 'staff_coach')
              )
            )
          )
          or (
            not exists (select 1 from current_libs)
            and (
              (
                public.has_active_fm_role (t.gym_id, 'programmer')
                and public.has_gym_staff_entitlement (t.gym_id, 'staff_programmer')
              )
              or (
                public.has_active_fm_role (t.gym_id, 'admin')
                and public.has_gym_staff_entitlement (t.gym_id, 'staff_admin')
              )
              or (
                public.has_active_fm_role (t.gym_id, 'coach')
                and public.has_gym_staff_entitlement (t.gym_id, 'staff_coach')
              )
            )
          )
        )
      )
  );
$$;

comment on function public.can_select_programming (uuid) is
  'Shared RLS helper: staff see scoped tracks/drafts; athletes only see published programming for their tracks.';

grant execute on function public.staff_can_manage_programming (uuid) to authenticated;
grant execute on function public.staff_can_delete_programming (uuid) to authenticated;
grant execute on function public.athlete_can_access_programming (uuid) to authenticated;
grant execute on function public.can_select_programming (uuid) to authenticated;

drop policy if exists programming_select on public.programming;
create policy programming_select on public.programming
  for select using (public.can_select_programming (id));

drop policy if exists pli_select on public.programming_line_item;
create policy pli_select on public.programming_line_item
  for select using (public.can_select_programming (programming_id));

drop policy if exists pla_select on public.programming_library_assignment;
create policy pla_select on public.programming_library_assignment
  for select using (public.can_select_programming (programming_id));

create or replace function public.delete_gym_programming_segment(p_programming_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_published_at timestamptz;
begin
  if not public.staff_can_delete_programming(p_programming_id) then
    raise exception 'Not allowed to delete this programming segment';
  end if;

  select p.published_at
  into v_published_at
  from public.programming p
  where p.id = p_programming_id
    and p.source = 'gym';

  if not found then
    raise exception 'Programming segment not found';
  end if;

  if v_published_at is not null then
    update public.programming
    set published_at = null
    where id = p_programming_id;

    delete from public.programming_library_assignment
    where programming_id = p_programming_id;

    return;
  end if;

  delete from public.programming_line_item
  where programming_id = p_programming_id
    and contact_id is null;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  delete from public.programming
  where id = p_programming_id
    and source = 'gym';
end;
$$;

comment on function public.delete_gym_programming_segment (uuid) is
  'Staff-only: drafts are deleted; published segments are unpublished and unassigned to preserve athlete history.';

create or replace function public.sync_programming_library_assignments(
  p_programming_id uuid,
  p_library_ids uuid[]
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_lib uuid;
  v_library_ids uuid[];
begin
  if not public.staff_can_delete_programming(p_programming_id) then
    raise exception 'Not allowed to update track assignments for this segment';
  end if;

  select p.gym_id
  into v_gym
  from public.programming p
  where p.id = p_programming_id
    and p.source = 'gym';

  if v_gym is null then
    raise exception 'Programming segment not found';
  end if;

  select coalesce(array_agg(distinct lib_id), '{}'::uuid[])
  into v_library_ids
  from unnest(coalesce(p_library_ids, '{}'::uuid[])) as libs(lib_id)
  where lib_id is not null;

  if coalesce(array_length(v_library_ids, 1), 0) = 0 then
    raise exception 'At least one track is required for this segment';
  end if;

  foreach v_lib in array v_library_ids loop
    if not (
      (
        public.has_active_fm_role(v_gym, 'programmer')
        and public.has_staff_library_scope(v_gym, v_lib, 'staff_programmer')
      )
      or (
        public.has_active_fm_role(v_gym, 'admin')
        and public.has_staff_library_scope(v_gym, v_lib, 'staff_admin')
      )
    ) then
      raise exception 'Not allowed to assign library %', v_lib;
    end if;
  end loop;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  insert into public.programming_library_assignment (programming_id, program_library_id)
  select p_programming_id, lib_id
  from unnest(v_library_ids) as libs(lib_id)
  on conflict do nothing;
end;
$$;

comment on function public.sync_programming_library_assignments (uuid, uuid[]) is
  'Staff-only: replace track assignments after validating current and target track scope.';

create or replace function public.athlete_can_log_performance(
  p_contact_id uuid,
  p_programming_id uuid,
  p_segment_group_id uuid,
  p_performance_date date
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select p_contact_id = public.auth_contact_id ()
    and exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = p_contact_id
        and fm.role = 'athlete'
        and fm.membership_status = 'active'
    )
    and (
      (
        p_programming_id is null
        and p_segment_group_id is null
      )
      or (
        p_programming_id is not null
        and public.athlete_can_access_programming(p_programming_id)
        and exists (
          select 1
          from public.programming p
          where p.id = p_programming_id
            and (
              p_performance_date is null
              or p.wod_date = p_performance_date
            )
        )
      )
      or (
        p_programming_id is null
        and p_segment_group_id is not null
        and exists (
          select 1
          from public.programming p
          where p.segment_group_id = p_segment_group_id
            and (
              p_performance_date is null
              or p.wod_date = p_performance_date
            )
            and public.athlete_can_access_programming(p.id)
        )
      )
    );
$$;

comment on function public.athlete_can_log_performance (uuid, uuid, uuid, date) is
  'Athlete performance write guard for manual PRs, published segments, and published group blocks.';

grant execute on function public.athlete_can_log_performance (uuid, uuid, uuid, date) to authenticated;

drop policy if exists athlete_performance_insert on public.athlete_performance;
create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    public.athlete_can_log_performance (
      contact_id,
      programming_id,
      segment_group_id,
      performance_date
    )
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

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
  )
  with check (
    public.athlete_can_log_performance (
      contact_id,
      programming_id,
      segment_group_id,
      performance_date
    )
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
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

create or replace function public.athlete_can_mark_segment_completion(
  p_contact_id uuid,
  p_programming_id uuid,
  p_segment_group_id uuid,
  p_performance_date date
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select p_contact_id = public.auth_contact_id ()
    and exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = p_contact_id
        and fm.role = 'athlete'
        and fm.membership_status = 'active'
    )
    and (
      (
        p_programming_id is not null
        and p_segment_group_id is null
        and public.athlete_can_access_programming(p_programming_id)
        and exists (
          select 1
          from public.programming p
          where p.id = p_programming_id
            and p.wod_date = p_performance_date
        )
        and exists (
          select 1
          from public.athlete_performance ap
          where ap.contact_id = p_contact_id
            and ap.programming_id = p_programming_id
            and (
              ap.score is not null
              or ap.weight_lifted is not null
              or ap.status is not null
            )
        )
      )
      or (
        p_programming_id is null
        and p_segment_group_id is not null
        and exists (
          select 1
          from public.programming p
          where p.segment_group_id = p_segment_group_id
            and p.wod_date = p_performance_date
            and public.athlete_can_access_programming(p.id)
        )
        and exists (
          select 1
          from public.athlete_performance ap
          where ap.contact_id = p_contact_id
            and ap.segment_group_id = p_segment_group_id
            and ap.programming_id is null
            and ap.score is not null
        )
      )
    );
$$;

comment on function public.athlete_can_mark_segment_completion (uuid, uuid, uuid, date) is
  'Completion rows must match published programming plus an actual athlete score/lift row.';

grant execute on function public.athlete_can_mark_segment_completion (uuid, uuid, uuid, date) to authenticated;

drop policy if exists athlete_segment_completion_insert on public.athlete_segment_completion;
create policy athlete_segment_completion_insert on public.athlete_segment_completion
  for insert with check (
    public.athlete_can_mark_segment_completion (
      contact_id,
      programming_id,
      segment_group_id,
      performance_date
    )
  );

drop policy if exists athlete_segment_completion_update on public.athlete_segment_completion;
create policy athlete_segment_completion_update on public.athlete_segment_completion
  for update using (contact_id = public.auth_contact_id ())
  with check (
    public.athlete_can_mark_segment_completion (
      contact_id,
      programming_id,
      segment_group_id,
      performance_date
    )
  );
