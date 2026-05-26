-- Lock multi-part block scoring to the WOD date. A copied segment can otherwise
-- reuse an old segment_group_id and bleed a prior day's score/completion forward.

create or replace function public.athlete_group_score_scope_ok (
  p_contact_id uuid,
  p_segment_group_id uuid,
  p_performance_date date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_segment_group_id is null
    or (
      p_performance_date is not null
      and exists (
        select 1
        from public.programming p
        join public.fitness_membership fm
          on fm.gym_id = p.gym_id
         and fm.contact_id = p_contact_id
         and fm.role = 'athlete'
         and fm.membership_status = 'active'
        where p.segment_group_id = p_segment_group_id
          and p.wod_date = p_performance_date
          and p.source = 'gym'
      )
    );
$$;

drop policy if exists athlete_performance_insert on public.athlete_performance;
create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    (
      contact_id = public.auth_contact_id ()
      and public.athlete_group_score_scope_ok (
        athlete_performance.contact_id,
        athlete_performance.segment_group_id,
        athlete_performance.performance_date
      )
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
    (
      contact_id = public.auth_contact_id ()
      and public.athlete_group_score_scope_ok (
        athlete_performance.contact_id,
        athlete_performance.segment_group_id,
        athlete_performance.performance_date
      )
    )
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );

create index if not exists athlete_performance_segment_group_date_idx
  on public.athlete_performance (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null;

create or replace function public.segment_completion_has_evidence (
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
  select case
    when p_programming_id is not null and p_segment_group_id is null then exists (
      select 1
      from public.athlete_performance ap
      join public.programming p on p.id = p_programming_id
      where ap.contact_id = p_contact_id
        and ap.programming_id = p_programming_id
        and ap.performance_date = p_performance_date
        and p.wod_date = p_performance_date
    )
    when p_segment_group_id is not null and p_programming_id is null then exists (
      select 1
      from public.athlete_performance ap
      where ap.contact_id = p_contact_id
        and ap.segment_group_id = p_segment_group_id
        and ap.programming_id is null
        and ap.programming_line_item_id is null
        and ap.performance_date = p_performance_date
        and exists (
          select 1
          from public.programming p
          where p.segment_group_id = p_segment_group_id
            and p.wod_date = p_performance_date
            and p.source = 'gym'
        )
    )
    else false
  end;
$$;

drop policy if exists athlete_segment_completion_insert on public.athlete_segment_completion;
create policy athlete_segment_completion_insert on public.athlete_segment_completion
  for insert with check (
    contact_id = public.auth_contact_id ()
    and public.segment_completion_has_evidence (
      athlete_segment_completion.contact_id,
      athlete_segment_completion.programming_id,
      athlete_segment_completion.segment_group_id,
      athlete_segment_completion.performance_date
    )
    and exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_segment_completion.contact_id
        and fm.role = 'athlete'
        and fm.membership_status = 'active'
    )
  );

drop policy if exists athlete_segment_completion_update on public.athlete_segment_completion;
create policy athlete_segment_completion_update on public.athlete_segment_completion
  for update using (contact_id = public.auth_contact_id ())
  with check (
    contact_id = public.auth_contact_id ()
    and public.segment_completion_has_evidence (
      athlete_segment_completion.contact_id,
      athlete_segment_completion.programming_id,
      athlete_segment_completion.segment_group_id,
      athlete_segment_completion.performance_date
    )
  );

drop index if exists public.athlete_segment_completion_group_uidx;
create unique index if not exists athlete_segment_completion_group_date_uidx
  on public.athlete_segment_completion (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null;
