-- Failed and pending lift attempts are not valid PRs.
-- Rebuild PR flags and summaries from completed/legacy lift rows so missed attempts
-- cannot drive athlete benchmark summaries or percent-based prescriptions.

with ranked_completed_lifts as (
  select
    ap.id,
    ap.contact_id,
    ap.benchmark_definition_id,
    ap.weight_lifted,
    coalesce(ap.performance_date, ap.created_at::date) as achieved_on,
    row_number() over (
      partition by ap.contact_id, ap.benchmark_definition_id
      order by ap.weight_lifted desc, coalesce(ap.performance_date, ap.created_at::date) desc, ap.created_at desc, ap.id desc
    ) as rn
  from public.athlete_performance ap
  where ap.benchmark_definition_id is not null
    and ap.weight_lifted is not null
    and ap.weight_lifted > 0
    and (ap.status is null or ap.status = 'completed')
),
best_completed_lifts as (
  select *
  from ranked_completed_lifts
  where rn = 1
)
update public.athlete_performance ap
set is_pr = exists (
  select 1
  from best_completed_lifts best
  where best.id = ap.id
)
where ap.benchmark_definition_id is not null
  and ap.is_pr is distinct from exists (
    select 1
    from best_completed_lifts best
    where best.id = ap.id
  );

with ranked_completed_lifts as (
  select
    ap.id,
    ap.contact_id,
    ap.benchmark_definition_id,
    ap.weight_lifted,
    coalesce(ap.performance_date, ap.created_at::date) as achieved_on,
    row_number() over (
      partition by ap.contact_id, ap.benchmark_definition_id
      order by ap.weight_lifted desc, coalesce(ap.performance_date, ap.created_at::date) desc, ap.created_at desc, ap.id desc
    ) as rn
  from public.athlete_performance ap
  where ap.benchmark_definition_id is not null
    and ap.weight_lifted is not null
    and ap.weight_lifted > 0
    and (ap.status is null or ap.status = 'completed')
),
best_completed_lifts as (
  select *
  from ranked_completed_lifts
  where rn = 1
)
insert into public.athlete_benchmark_summary (
  contact_id,
  benchmark_definition_id,
  current_pr_weight,
  date_pr_achieved
)
select
  best.contact_id,
  best.benchmark_definition_id,
  best.weight_lifted,
  best.achieved_on
from best_completed_lifts best
on conflict (contact_id, benchmark_definition_id)
do update set
  current_pr_weight = excluded.current_pr_weight,
  date_pr_achieved = excluded.date_pr_achieved;

delete from public.athlete_benchmark_summary abs
where exists (
    select 1
    from public.athlete_performance ap
    where ap.contact_id = abs.contact_id
      and ap.benchmark_definition_id = abs.benchmark_definition_id
      and ap.weight_lifted is not null
  )
  and not exists (
    select 1
    from public.athlete_performance ap
    where ap.contact_id = abs.contact_id
      and ap.benchmark_definition_id = abs.benchmark_definition_id
      and ap.weight_lifted is not null
      and ap.weight_lifted > 0
      and (ap.status is null or ap.status = 'completed')
  );
