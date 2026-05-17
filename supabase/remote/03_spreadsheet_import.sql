-- Auto-generated: Paul Crossfit Tracker (CrossFit Stats) + SugarWod + Max Lifts

-- Standalone PR / 1RM history only (preserve Triad class performances from 04)
delete from public.athlete_performance where contact_id = 'c0000000-0000-4000-8000-000000000001' and programming_id is null;
delete from public.athlete_benchmark_summary where contact_id = 'c0000000-0000-4000-8000-000000000001';
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 425, '2025-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Back Squat' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 385, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Front Squat' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 505, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Deadlift' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 350, '2025-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 315, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Push Jerk' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 235, '2025-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Power Snatch' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 220, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Hang Power Snatch' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 305, '2023-05-13'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Jerk' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 270, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Bench Press' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 320, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Clean & Jerk' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 275, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Thruster' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 315, '2025-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Hang Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 315, '2025-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Power Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 285, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Hang Power Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 245, '2022-12-30'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Snatch' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 265, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Overhead Squat' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 295, '2025-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Push Press' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 205, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Strict Press' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 220, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Hang Snatch' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 325, '2024-12-15'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Split Jerk' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 235, '235', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 235, '235', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 225, '225', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 214, '214', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 210, '210', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 175, '175', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 235, '235', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 240, '240', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 230, '230', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 217, '217', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 215, '215', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 175, '175', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 220, '220', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 215, '215', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 195, '195', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 190, '190', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 165, '165', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 220, '220', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 215, '215', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 185, '185', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 208.5, '208.5', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Snatch'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 315, '315', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 310, '310', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 300, '300', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 267, '267', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 280, '280', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 265, '265', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 350, '350', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 345, '345', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 320, '320', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 310, '310', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 300, '300', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 275, '275', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 285, '285', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 280, '280', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 250, '250', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 235, '235', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Power Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 315, '315', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 300, '300', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 295, '295', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 275, '275', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 265, '265', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Hang Clean'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 320, '320', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean & Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 305, '305', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean & Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 283, '283', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean & Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 280, '280', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean & Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 245, '245', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Clean & Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 315, '315', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 305, '305', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 270, '270', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 265, '265', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 325, '325', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Split Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 310, '310', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Split Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 287, '287', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Split Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 283, '283', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Split Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 245, '245', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Split Jerk'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 425, '425', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Back Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 422.5, '422.5', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Back Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 410, '410', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Back Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 375, '375', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Back Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 365, '365', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Back Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 345, '345', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Back Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2026-12-15', 'completed', 375, '375', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2026-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 365, '365', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 385, '385', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 370, '370', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 330, '330', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 315, '315', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 285, '285', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Front Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 265, '265', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Overhead Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 260, '260', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Overhead Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 230, '230', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Overhead Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 185, '185', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Overhead Squat'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 270, '270', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Bench Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 260, '260', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Bench Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 243, '243', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Bench Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 225, '225', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Bench Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 295, '295', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 290, '290', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 285, '285', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 260, '260', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 255, '255', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 215, '215', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Push Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 200, '200', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Strict Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 205, '205', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Strict Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 195, '195', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Strict Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 177, '177', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Strict Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 175, '175', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Strict Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 155, '155', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Strict Press'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2025-12-15', 'completed', 485, '485', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Deadlift'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2025-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 505, '505', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Deadlift'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 500, '500', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Deadlift'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 445, '445', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Deadlift'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 465, '465', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Deadlift'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2020-12-15', 'completed', 455, '455', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Deadlift'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2020-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2024-12-15', 'completed', 275, '275', true
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Thruster'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2024-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2023-12-15', 'completed', 265, '265', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Thruster'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2023-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2022-12-15', 'completed', 235, '235', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Thruster'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2022-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, bd.id, '2021-12-15', 'completed', 205, '205', false
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = 'Thruster'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_definition_id = bd.id and ap.performance_date = '2021-12-15'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2022-02-08', 'completed', '4:15', 255, true
from public.benchmark_type t where t.name = 'Amanda'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2022-02-08'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2020-11-04', 'completed', '26+23', 26, true
from public.benchmark_type t where t.name = 'Cindy'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2020-11-04'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-01-19', 'completed', '2:26', 146, true
from public.benchmark_type t where t.name = 'Diane'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2021-01-19'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-05-12', 'completed', '2:53', 173, true
from public.benchmark_type t where t.name = 'Elizabeth'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2021-05-12'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-10-14', 'completed', '2:27', 147, true
from public.benchmark_type t where t.name = 'Fran'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2021-10-14'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2022-07-12', 'completed', '1:38', 98, true
from public.benchmark_type t where t.name = 'Grace'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2022-07-12'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-05-03', 'completed', '7:03', 423, true
from public.benchmark_type t where t.name = 'Helen'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2021-05-03'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-07-19', 'completed', '1:43', 143, true
from public.benchmark_type t where t.name = 'Isabel'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2021-07-19'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2020-09-18', 'completed', '5:46', 346, true
from public.benchmark_type t where t.name = 'Jackie'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2020-09-18'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2022-10-14', 'completed', '10:33', 1033, true
from public.benchmark_type t where t.name = 'Nancy'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2022-10-14'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2026-04-16', 'completed', '6:45', 405, true
from public.benchmark_type t where t.name = 'Annie'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2026-04-16'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2026-05-09', 'completed', '42:18', 2538, true
from public.benchmark_type t where t.name = 'Murph'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2026-05-09'
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2025-08-22', 'completed', '12:45', 765, true
from public.benchmark_type t where t.name = 'DT'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = '2025-08-22'
);