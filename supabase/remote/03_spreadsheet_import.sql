-- Auto-generated from Google Drive exports (SugarWod + Max Lifts)
alter table public.programming disable trigger programming_update_guard;
alter table public.programming_line_item disable trigger pli_update_guard;

-- Programming: Triad Workout Trends .gsheet is cloud-only; keep seeded May weeks from 02_paul_auth_dates_prs.sql

delete from public.athlete_performance where contact_id = 'c0000000-0000-4000-8000-000000000001';
delete from public.athlete_benchmark_summary where contact_id = 'c0000000-0000-4000-8000-000000000001';
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 425, '2025-11-04'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Back Squat' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 360, '2025-05-27'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Front Squat' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 505, '2024-11-08'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Deadlift' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 350, '2025-12-03'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 292.2000122, '2023-09-02'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Push Jerk' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 220, '2023-09-11'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Power Snatch' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 195, '2021-11-17'
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
select 'c0000000-0000-4000-8000-000000000001', bd.id, 270, '2024-09-03'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Bench Press' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 305, '2025-12-18'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Clean & Jerk' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 275, '2024-08-29'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Thruster' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 280, '2023-01-17'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Hang Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 315, '2025-01-28'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Power Clean' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 285, '2024-12-04'
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
select 'c0000000-0000-4000-8000-000000000001', bd.id, 265, '2024-11-01'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Overhead Squat' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 295, '2025-09-08'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Push Press' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select 'c0000000-0000-4000-8000-000000000001', bd.id, 205, '2024-11-11'
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = 'Strict Press' and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2022-02-08', 'completed', '4:15', 255, true
from public.benchmark_type t where t.name = 'Amanda'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2020-11-04', 'completed', '26+23', 26, true
from public.benchmark_type t where t.name = 'Cindy'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-01-19', 'completed', '2:26', 146, true
from public.benchmark_type t where t.name = 'Diane'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-05-12', 'completed', '2:53', 173, true
from public.benchmark_type t where t.name = 'Elizabeth'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-10-14', 'completed', '2:27', 147, true
from public.benchmark_type t where t.name = 'Fran'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2022-07-12', 'completed', '1:38', 98, true
from public.benchmark_type t where t.name = 'Grace'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-05-03', 'completed', '7:03', 423, true
from public.benchmark_type t where t.name = 'Helen'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2021-07-19', 'completed', '1:43', 143, true
from public.benchmark_type t where t.name = 'Isabel'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2020-09-18', 'completed', '5:46', 346, true
from public.benchmark_type t where t.name = 'Jackie'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2022-10-14', 'completed', '10:33', 1033, true
from public.benchmark_type t where t.name = 'Nancy'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2026-04-16', 'completed', '6:45', 405, true
from public.benchmark_type t where t.name = 'Annie'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2026-05-09', 'completed', '42:18', 2538, true
from public.benchmark_type t where t.name = 'Murph'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select 'c0000000-0000-4000-8000-000000000001', t.id, '2025-08-22', 'completed', '12:45', 765, true
from public.benchmark_type t where t.name = 'DT'
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = 'c0000000-0000-4000-8000-000000000001' and ap.benchmark_type_id = t.id and ap.programming_id is null
);
alter table public.programming enable trigger programming_update_guard;
alter table public.programming_line_item enable trigger pli_update_guard;