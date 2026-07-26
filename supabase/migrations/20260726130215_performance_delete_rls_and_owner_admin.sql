-- Allow athletes (and gym admins) to delete their own performance / PR summary rows.
-- Mark N/A and PR recompute both require DELETE; policies previously only covered select/insert/update.
-- Also treat fitness_membership.role = 'owner' as admin-scoped (UI already maps owner → admin persona).

create or replace function public.is_gym_admin_scoped (p_gym_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.fitness_membership fm
    join public.athlete_subscription s
      on s.contact_id = fm.contact_id
     and s.gym_id = fm.gym_id
    where fm.contact_id = public.auth_contact_id()
      and fm.gym_id = p_gym_id
      and fm.role in ('admin', 'owner')
      and fm.membership_status = 'active'
      and s.status = 'active'
      and s.subscription_scope = 'staff_admin'
  );
$$;

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

-- Repair PR vault rows inflated by class working sets (multi-rep loads stored on an XRM definition).
create or replace view public._rxbetter_pr_best_eligible as
with eligible as (
  select
    ap.id,
    ap.contact_id,
    ap.benchmark_definition_id,
    ap.weight_lifted,
    ap.performance_date,
    ap.created_at,
    row_number() over (
      partition by ap.contact_id, ap.benchmark_definition_id
      order by
        ap.weight_lifted desc,
        coalesce(ap.performance_date, (ap.created_at at time zone 'utc')::date) desc nulls last,
        ap.created_at desc nulls last
    ) as rn
  from public.athlete_performance ap
  join public.benchmark_definition bd on bd.id = ap.benchmark_definition_id
  where ap.weight_lifted is not null
    and ap.weight_lifted > 0
    and (
      ap.programming_line_item_id is null
      or (
        ap.reps_prescribed is not null
        and ap.reps_prescribed::numeric = bd.rep_count::numeric
      )
    )
)
select
  id,
  contact_id,
  benchmark_definition_id,
  weight_lifted,
  performance_date,
  created_at
from eligible
where rn = 1;

update public.athlete_performance ap
set is_pr = false
where ap.benchmark_definition_id is not null
  and ap.is_pr = true
  and not exists (
    select 1 from public._rxbetter_pr_best_eligible b where b.id = ap.id
  );

insert into public.athlete_benchmark_summary (
  contact_id,
  benchmark_definition_id,
  current_pr_weight,
  date_pr_achieved
)
select
  b.contact_id,
  b.benchmark_definition_id,
  b.weight_lifted,
  coalesce(b.performance_date, (b.created_at at time zone 'utc')::date)
from public._rxbetter_pr_best_eligible b
on conflict (contact_id, benchmark_definition_id) do update
  set current_pr_weight = excluded.current_pr_weight,
      date_pr_achieved = excluded.date_pr_achieved,
      updated_at = now();

update public.athlete_performance ap
set is_pr = true
from public._rxbetter_pr_best_eligible b
where ap.id = b.id
  and ap.is_pr is distinct from true;

delete from public.athlete_benchmark_summary abs
where not exists (
  select 1
  from public._rxbetter_pr_best_eligible b
  where b.contact_id = abs.contact_id
    and b.benchmark_definition_id = abs.benchmark_definition_id
);

drop view public._rxbetter_pr_best_eligible;
