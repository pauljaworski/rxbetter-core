-- Triad SugarWOD programming import (draft — published_at left null)
begin;
alter table public.programming disable trigger programming_update_guard;
alter table public.programming_line_item disable trigger pli_update_guard;

delete from public.programming_library_assignment where programming_id in (
  select id from public.programming where gym_id = (select id from public.gym where name ilike 'Triad Training' limit 1)
    and wod_date >= '2026-06-01' and wod_date <= '2026-07-25' and source = 'gym'
    and id::text like 'e5000000%'
);
delete from public.programming_line_item where programming_id in (
  select id from public.programming where gym_id = (select id from public.gym where name ilike 'Triad Training' limit 1)
    and wod_date >= '2026-06-01' and wod_date <= '2026-07-25' and source = 'gym'
    and id::text like 'e5000000%'
);
delete from public.programming where gym_id = (select id from public.gym where name ilike 'Triad Training' limit 1)
  and wod_date >= '2026-06-01' and wod_date <= '2026-07-25' and source = 'gym'
  and id::text like 'e5000000%';

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606010001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Back Squat', '2026-06-01', 'weightlifting', 'strength', 'rx', 1, 'Back Squat (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606010001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000001', 'e5000000-0000-4000-8000-202606010001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606010002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-01', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets DB Step-Ups x10/side DB RDL x10 DB Hip Bridge x15 Plank x :45', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606010002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000002', 'e5000000-0000-4000-8000-202606010002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606010003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-01', 'metcon', 'for_time', 'rx', 3, 'CrossFit  (5 Rounds for reps)
2 Rounds:  3:00 Window 20/15 Cal Bike 15 Sit-Ups Max Goblet Squats  Rest 1:00  2 Rounds:  2:30 Window 15/12 Cal bike Max DB Box Step Overs  Rest 1:00  1 Round:  1:30 Window Max Burpees  Score = total reps', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606010003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000003', 'e5000000-0000-4000-8000-202606010003', 1, 'CrossFit  (5 Rounds for reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606010004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-01', 'metcon', 'for_time', 'scaled', 4, 'Performance  (5 Rounds for reps)
2 Rounds:  3:00 Window 1:20 Cal Bike 15 Sit-Ups Max Goblet Squats  Rest 1:00  2 Rounds:  2:30 Window 1:00 Cal bike Max DB Box Step Overs  Rest 1:00  1 Round:  2:00 Window Max Burpees  Score = total reps', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606010004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000004', 'e5000000-0000-4000-8000-202606010004', 1, 'Performance  (5 Rounds for reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606020001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Shoulder Press', '2026-06-02', 'weightlifting', 'strength', 'rx', 1, 'Shoulder Press (1 X 5)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606020001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000005', 'e5000000-0000-4000-8000-202606020001', (select id from public.benchmark_type where name = 'Strict Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Strict Press' and bd.rep_count = 5), 1, 5, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606020002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-02', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets DB Strict Press x10 DB Lateral Raise x15 DB Row x12/side Push-Up Hold', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606020002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000006', 'e5000000-0000-4000-8000-202606020002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606020003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-02', 'metcon', 'for_time', 'rx', 3, 'Crossfit  (7 Rounds for time ↓ shorter is better)
Every 2:30 x 7 Rounds  16/12 Cal Ski 8 Hang Power Cleans 135/95 8 Chest-to-Bar Pull-Ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606020003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000007', 'e5000000-0000-4000-8000-202606020003', 1, 'Crossfit  (7 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606020004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-02', 'metcon', 'for_time', 'scaled', 4, 'Performance  (7 Rounds for time ↓ shorter is better)
Every 2:30 x 7 Rounds  1:00 Ski for cals 8 Dbl DB Hang Power Cleans  8 Wall walks', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606020004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000008', 'e5000000-0000-4000-8000-202606020004', 1, 'Performance  (7 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606030001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Clean Pull', '2026-06-03', 'weightlifting', 'strength', 'rx', 1, 'Clean Pull (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606030001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000009', 'e5000000-0000-4000-8000-202606030001', (select id from public.benchmark_type where name = 'Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Clean' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606030002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-03', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets 1 min max cal ski 1 min rest 1 min hollow hold 1 min rest', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606030002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000010', 'e5000000-0000-4000-8000-202606030002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606030003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-03', 'metcon', 'for_time', 'rx', 3, 'CrossFit  (Time ↓ Shorter is Better)
For Time   10-20-30-40-50  Wall Balls 20/14  20-40-60-80-100  Dubs  After each round: 15/12 Cal row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606030003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000011', 'e5000000-0000-4000-8000-202606030003', 1, 'CrossFit  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606030004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-03', 'metcon', 'for_time', 'scaled', 4, 'Performance  (Time ↓ Shorter is Better)
For Time   10-20-30-40-50  Wall Balls  20-40-60-80-100  Jump rope  After each round: 1 minute row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606030004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000012', 'e5000000-0000-4000-8000-202606030004', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606040001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Snatch', '2026-06-04', 'weightlifting', 'strength', 'rx', 1, 'Snatch (1 X 2)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606040001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000013', 'e5000000-0000-4000-8000-202606040001', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), 1, 2, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606040002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-04', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets Heavy DB Carry x80’ DB Bench x15 Hammer Curl x15/side', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606040002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000014', 'e5000000-0000-4000-8000-202606040002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606040003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-04', 'metcon', 'amrap', 'rx', 3, 'CrossFit  (AMRAP - Rounds and Reps)
18 minute AMRAP  3-6-9-12-15-18…  Front Squats 135/95 Bar-Facing Burpees Toes-to-Bar', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606040003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000015', 'e5000000-0000-4000-8000-202606040003', 1, 'CrossFit  (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606040004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-04', 'metcon', 'amrap', 'scaled', 4, 'Performance  (AMRAP - Rounds and Reps)
18 minute AMRAP  3-6-9-12-15-18…  DB Front Squats Up downs V-ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606040004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000016', 'e5000000-0000-4000-8000-202606040004', 1, 'Performance  (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606050001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-05', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
1200m Run  Then:  4 Rounds 30/24 Cal Row 20 Deadlifts 185/135 5-10 Muscle ups   Finish with:  800m Run', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606050001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000017', 'e5000000-0000-4000-8000-202606050001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606050002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-05', 'metcon', 'for_time', 'scaled', 2, 'Performance  (Time ↓ Shorter is Better)
1200m Run  Then:  4 Rounds 2 minute Row for calories  20 KB sumo DL Hugh pulls 15 Ring rows   Finish with:  800m Run', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606050002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000018', 'e5000000-0000-4000-8000-202606050002', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606060001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-06', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
Teams of 2  4 Rounds For Time  400m Run Together  Then split:  30 DB Snatches 50/35 30 Box Jump Overs 24/20 30 Shoulder-to-Overhead 115/80  Then:  Rest 2:00 after your 4th round     Final Finisher:  6 Minutes  Alternate every 30 sec: Max Calories Row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606060001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000019', 'e5000000-0000-4000-8000-202606060001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606060002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-06', 'metcon', 'for_time', 'scaled', 2, 'Performance  (Time ↓ Shorter is Better)
Teams of 2  4 Rounds For Time  400m Run Together  Then split:  30 DB Snatches 30 Box step overs  30 DB Shoulder-to-Overhead  Then:  Rest 2:00 after your 4th round     Final Finisher:  6 Minutes  Alternate every 30 sec: Max Calories Row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606060002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000020', 'e5000000-0000-4000-8000-202606060002', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606080001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Front Squat', '2026-06-08', 'weightlifting', 'strength', 'rx', 1, 'Front Squat (1 X 4)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606080001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000021', 'e5000000-0000-4000-8000-202606080001', (select id from public.benchmark_type where name = 'Front Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Front Squat' and bd.rep_count = 4), 1, 4, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606080002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-08', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength (Checkmark)
4 Sets DB Goblet Squat x12 DB Walking Lunge x10/side DB RDL x12 Plank x :45', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606080002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000022', 'e5000000-0000-4000-8000-202606080002', 1, 'Performance Strength (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606080003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-08', 'metcon', 'for_time', 'rx', 3, 'CrossFit  (Time ↓ Shorter is Better)
30/24 Cal Row 30 Toes-to-Bar  15 Clean and Jerks 135/95 20/16 Cal Row 20 Toes-to-Bar  10 Clean and jerks 155/105 10/8 Cal Row 10 Toes-to-Bar  5 Clean and jerks 185/125', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606080003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000023', 'e5000000-0000-4000-8000-202606080003', 1, 'CrossFit  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606080004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-08', 'metcon', 'for_time', 'scaled', 4, 'Performance  (Time ↓ Shorter is Better)
For Time 30/24 Cal Row 30 V-ups  30 KBS 20/16 Cal Row 20 V-ups  20 KBS 10/8 Cal Row 10 V-ups  10 KBS  *increase weight on KBS each round', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606080004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000024', 'e5000000-0000-4000-8000-202606080004', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606090001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Shoulder Press', '2026-06-09', 'weightlifting', 'strength', 'rx', 1, 'Shoulder Press (1 X 5)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606090001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000025', 'e5000000-0000-4000-8000-202606090001', (select id from public.benchmark_type where name = 'Strict Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Strict Press' and bd.rep_count = 5), 1, 5, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606090002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-09', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 Sets Seated DB Shoulder Press x12 DB Lateral Raise x15 Push-Ups xMax Hollow Hold x :40', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606090002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000026', 'e5000000-0000-4000-8000-202606090002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606090003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-09', 'metcon', 'for_time', 'rx', 3, 'CrossFit (5 Rounds for time ↓ shorter is better)
Every 3:30 x 5 Sets 15/12 Cal Echo Bike 12 Bar-Facing Burpees 6 Snatches 155/105', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606090003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000027', 'e5000000-0000-4000-8000-202606090003', 1, 'CrossFit (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606090004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-09', 'metcon', 'for_time', 'scaled', 4, 'Performance  (5 Rounds for time ↓ shorter is better)
Every 3:30 x 5 Sets 1 min calories on the Bike 10 Burpees 12 Dbl DB Hang squat Clean', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606090004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000028', 'e5000000-0000-4000-8000-202606090004', 1, 'Performance  (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606100001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Clean', '2026-06-10', 'weightlifting', 'strength', 'rx', 1, 'Clean (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606100001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000029', 'e5000000-0000-4000-8000-202606100001', (select id from public.benchmark_type where name = 'Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Clean' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606100002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-10', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength (Checkmark)
4 Sets DB RDL x12 DB Step-Ups x10/side Weighted Glute Bridge x20 Side Plank x :30/side', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606100002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000030', 'e5000000-0000-4000-8000-202606100002', 1, 'Performance Strength (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606100003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-10', 'metcon', 'amrap', 'rx', 3, 'CrossFit  (AMRAP - Rounds and Reps)
AMRAP 18 15 Wall Balls (20/14) 15 Pull-Ups 15 Push-Ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606100003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000031', 'e5000000-0000-4000-8000-202606100003', 1, 'CrossFit  (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606100004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-10', 'metcon', 'amrap', 'scaled', 4, 'Performance  (AMRAP - Rounds and Reps)
AMRAP 18 12 Wallballs  12 Ring Rows 12 push ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606100004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000032', 'e5000000-0000-4000-8000-202606100004', 1, 'Performance  (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606110001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Snatch', '2026-06-11', 'weightlifting', 'strength', 'rx', 1, 'Snatch (1 X 2)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606110001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000033', 'e5000000-0000-4000-8000-202606110001', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), 1, 2, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606110002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-11', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 Sets  15 Seated DB curl and presses  10 DB Front raises   10 DB Lateral Raises', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606110002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000034', 'e5000000-0000-4000-8000-202606110002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606110003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-11', 'metcon', 'for_time', 'rx', 3, 'CrossFit (5 Rounds for time ↓ shorter is better)
5 Rounds  15/12 Cal ski   14 Hang Power cleans 115/75  13 Box jump overs 24/20  Rest 1 minute between rounds', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606110003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000035', 'e5000000-0000-4000-8000-202606110003', 1, 'CrossFit (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606110004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-11', 'metcon', 'for_time', 'scaled', 4, 'Performance (5 Rounds for time ↓ shorter is better)
5 Rounds  1 minute ski for calories     14 Alt DB hang snatches   13 Box vault overs  Rest 1 minute between rounds', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606110004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000036', 'e5000000-0000-4000-8000-202606110004', 1, 'Performance (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606120001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-12', 'metcon', 'for_time', 'rx', 1, 'CrossFit  (Time ↓ Shorter is Better)
For Time  1000m Row 80 Wall Balls (20/14) 60 Dumbbell Snatches (50/35)  8000m run 40 Burpee Box Jump Overs (24/20)  20 Bar muscle ups  1000m Ski', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606120001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000037', 'e5000000-0000-4000-8000-202606120001', 1, 'CrossFit  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606120002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-12', 'metcon', 'for_time', 'scaled', 2, 'Performance  (Time ↓ Shorter is Better)
For Time  800m Row 80 SB Front Squats  60 SB hang power cleans   600m Run 40 Burpees  20 Wall walks  800m ski', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606120002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000038', 'e5000000-0000-4000-8000-202606120002', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606130001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-13', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
5 rounds   400m run together  30 Power cleans **  30 T2B   20 Alt Devils press 50/35     Rounds 1- 95/65  Rounds 2- 115/105  Rounds 3- 135/95  Rounds 4- 155/105  Rounds 5- 185/125', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606130001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000039', 'e5000000-0000-4000-8000-202606130001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606130002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-13', 'metcon', 'for_time', 'scaled', 2, 'Performance  (Time ↓ Shorter is Better)
5 Rounds   400m run   30 Dbl DB Farmers carry walking lunges   30 Hanging Knee raises   30 Dbl DB S2OH', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606130002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000040', 'e5000000-0000-4000-8000-202606130002', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606150001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Back Squat', '2026-06-15', 'weightlifting', 'strength', 'rx', 1, 'Back Squat (8 X 2)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606150001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000041', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 1, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000042', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 2, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000043', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 3, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000044', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 4, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000045', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 5, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000046', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 6, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000047', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 7, 2, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000048', 'e5000000-0000-4000-8000-202606150001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 8, 2, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606150002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-15', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets DB FR Squat x12 DB Reverse Lunge x10/side DB Hip Thrust x15 Dead Bug x :40', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606150002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000049', 'e5000000-0000-4000-8000-202606150002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606150003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-15', 'metcon', 'for_time', 'rx', 3, 'CrossFit  (Time ↓ Shorter is Better)
For Time 1200m Row 120 Air Squats 100 Sit-Ups 40 Burpees to a 6” target', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606150003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000050', 'e5000000-0000-4000-8000-202606150003', 1, 'CrossFit  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606150004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-15', 'metcon', 'for_time', 'scaled', 4, 'Performance  (Time ↓ Shorter is Better)
For Time 1000m Row 75 DB Goblet Squats 75 V-ups  50 Up-Downs', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606150004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000051', 'e5000000-0000-4000-8000-202606150004', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606160001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Clean', '2026-06-16', 'weightlifting', 'strength', 'rx', 1, 'Clean (1 X 1)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606160001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000052', 'e5000000-0000-4000-8000-202606160001', (select id from public.benchmark_type where name = 'Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Clean' and bd.rep_count = 1), 1, 1, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606160002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-16', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets DB Bench Press x12 1-Arm DB Row x12/side DB Lateral Raise x15 Push-Ups x max (stop 2-3 before failure)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606160002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000053', 'e5000000-0000-4000-8000-202606160002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606160003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-16', 'metcon', 'for_time', 'rx', 3, 'CrossFit (Time ↓ Shorter is Better)
5 Rounds For Time 400m run 15 Box Step-Overs (50s/35s) 15 Ring Dips', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606160003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000054', 'e5000000-0000-4000-8000-202606160003', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606160004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-16', 'metcon', 'for_time', 'scaled', 4, 'Performance  (Time ↓ Shorter is Better)
5 Rounds For Time (Cap 20) 400m Run 15 DB Step-Overs 12 Elevated Push-Ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606160004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000055', 'e5000000-0000-4000-8000-202606160004', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606170001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Snatch', '2026-06-17', 'weightlifting', 'strength', 'rx', 1, 'Snatch (1 X 2)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606170001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000056', 'e5000000-0000-4000-8000-202606170001', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), 1, 2, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606170002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-17', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength (Checkmark)
4 sets 20 Single DB side bends L  100’ Single arm DB carry L  20 Single DB side bends R  100’ Single arm DB carry R', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606170002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000057', 'e5000000-0000-4000-8000-202606170002', 1, 'Performance Strength (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606170003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-17', 'metcon', 'for_time', 'rx', 3, 'CrossFit  (5 Rounds for time ↓ shorter is better)
Every 4 minutes x 5 sets 10 Power Snatches (95/65) 12 Box Jump Overs (24/20) 14/12 Cal Bike', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606170003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000058', 'e5000000-0000-4000-8000-202606170003', 1, 'CrossFit  (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606170004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-17', 'metcon', 'for_time', 'scaled', 4, 'Performance  (5 Rounds for time ↓ shorter is better)
Every 4 minutes x 5 sets 14 Alt DB Snatches 14 Box vault overs  1:00 Bike for Cals', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606170004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000059', 'e5000000-0000-4000-8000-202606170004', 1, 'Performance  (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606180001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Sumo Deadlift', '2026-06-18', 'weightlifting', 'strength', 'rx', 1, 'Sumo Deadlift (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606180001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000060', 'e5000000-0000-4000-8000-202606180001', null, null, 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606180002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-18', 'metcon', 'for_time', 'scaled', 2, 'Performance Strength  (Checkmark)
4 sets DB Hammer Curl x15 DB Strict Press x15 Plank Pull Through x10/side', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606180002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000061', 'e5000000-0000-4000-8000-202606180002', 1, 'Performance Strength  (Checkmark)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606180003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-18', 'metcon', 'for_time', 'rx', 3, 'CrossFit  (Time ↓ Shorter is Better)
20-16-12-8-4 Front Squats 135/95 HSPU  After each round: 12/10 Cal Row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606180003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000062', 'e5000000-0000-4000-8000-202606180003', 1, 'CrossFit  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606180004', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-18', 'metcon', 'for_time', 'scaled', 4, 'Performance  (Time ↓ Shorter is Better)
20-16-12-8-4 DB Front Squats Elevated Push ups  After each round: :30 Row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606180004', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000063', 'e5000000-0000-4000-8000-202606180004', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606190001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-19', 'metcon', 'amrap', 'rx', 1, 'CrossFit  (AMRAP - Rounds and Reps)
5 Rounds 5:00 ON / 2:00 OFF  During each 5:00:  30/24 Cal Bike Then in remaining time: Max Rounds of:  4 Burpee Box jump overs 24/20 6 Deadlifts (225/155) 8 T2B', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606190001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000064', 'e5000000-0000-4000-8000-202606190001', 1, 'CrossFit  (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606190002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-19', 'metcon', 'amrap', 'scaled', 2, 'Performance  (AMRAP - Rounds and Reps)
5 Rounds 5:00 ON / 2:00 OFF  2:00  Bike for Calories  Then: Max Rounds of: 4 Burpee Box get overs  8 KB Deadlifts  10 V-ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606190002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000065', 'e5000000-0000-4000-8000-202606190002', 1, 'Performance  (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606200001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Chief DT', '2026-06-20', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
"Chief DT"  with a partner- you go, I go  10 rounds TOTAL  200m run  1 round of DT 135/95     10 rounds TOTAL  250/200m row  1 round of the Chief 135/95     10 rounds TOTAL  15/12 cal bike  9 bar facing burpees  3 thrusters 135/95', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606200001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000066', 'e5000000-0000-4000-8000-202606200001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606200002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-20', 'metcon', 'for_time', 'scaled', 2, 'Performance  (Time ↓ Shorter is Better)
Part 1 – 10 Rounds TOTAL  200m Run 1 Round of  DB DT       Part 2 – 10 Rounds TOTAL  250/200m Row 1 Round of  DB Chief       Part 3 – 10 Rounds TOTAL  15/12 Cal Bike 9 Up-Downs 6 DB Thrusters', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606200002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000067', 'e5000000-0000-4000-8000-202606200002', 1, 'Performance  (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606220001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Front Squat', '2026-06-22', 'weightlifting', 'strength', 'rx', 1, 'Front Squat (1 X 4)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606220001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000068', 'e5000000-0000-4000-8000-202606220001', (select id from public.benchmark_type where name = 'Front Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Front Squat' and bd.rep_count = 4), 1, 4, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606220002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-22', 'metcon', 'for_time', 'rx', 2, 'Crossfit (Time ↓ Shorter is Better)
For Time (Cap 18)  4 Rounds  15/12 Cal Ski   12 Front Rack Lunges 135/95 9   Hand Stand Push ups    6 Burpee Box Jump Overs 30/24', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606220002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000069', 'e5000000-0000-4000-8000-202606220002', 1, 'Crossfit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606220003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-22', 'metcon', 'for_time', 'scaled', 3, 'Performance (Time ↓ Shorter is Better)
For Time (Cap 18)  4 Rounds  1:00 Ski for calories  12 DB Lunges  12 Push-Ups   8 Burpee Box Step Overs', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606220003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000070', 'e5000000-0000-4000-8000-202606220003', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606230001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Bench Press', '2026-06-23', 'weightlifting', 'strength', 'rx', 1, 'Bench Press (1 X 5)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606230001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000071', 'e5000000-0000-4000-8000-202606230001', (select id from public.benchmark_type where name = 'Bench Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Bench Press' and bd.rep_count = 5), 1, 5, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606230002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-23', 'metcon', 'for_time', 'rx_plus', 2, 'Crossfit (6 Rounds for time ↓ shorter is better)
Every 3 minutes x 6  250/200m row  5 Deadlifts  3 Power cleans  1 S2OH @185/125   RX+= 225/155', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606230002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000072', 'e5000000-0000-4000-8000-202606230002', 1, 'Crossfit (6 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606230003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-23', 'metcon', 'for_time', 'scaled', 3, 'Performance (6 Rounds for time ↓ shorter is better)
Every 3 minutes x 6  250/200m row  5 DB Deadlifts  5 DB Thrusters  DB Farmers hold until 2:15', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606230003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000073', 'e5000000-0000-4000-8000-202606230003', 1, 'Performance (6 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606240001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Power Snatch', '2026-06-24', 'weightlifting', 'strength', 'rx', 1, 'Power Snatch (1 X 2)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606240001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000074', 'e5000000-0000-4000-8000-202606240001', (select id from public.benchmark_type where name = 'Power Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Snatch' and bd.rep_count = 2), 1, 2, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606240002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-24', 'metcon', 'for_time', 'rx', 2, 'Crossfit (Time ↓ Shorter is Better)
4 Rounds For Time (Cap 20)  400m Row  5 Wall walks    10 Power snatches 95/65  15 T2B', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606240002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000075', 'e5000000-0000-4000-8000-202606240002', 1, 'Crossfit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606240003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-24', 'metcon', 'for_time', 'scaled', 3, 'Performance (Time ↓ Shorter is Better)
4 Rounds For Time (Cap 20)  400m run  5 Wall walks/kick ups    14 Alt DB snatch  14 V-ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606240003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000076', 'e5000000-0000-4000-8000-202606240003', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606250001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Clean', '2026-06-25', 'weightlifting', 'strength', 'rx', 1, 'Clean (1 X 1)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606250001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000077', 'e5000000-0000-4000-8000-202606250001', (select id from public.benchmark_type where name = 'Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Clean' and bd.rep_count = 1), 1, 1, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606250002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-25', 'metcon', 'amrap', 'rx', 2, 'Crossfit (AMRAP - Rounds and Reps)
Ascending Ladder  20 minute AMRAP   3-6-9-12-15…   Push Jerks 115/75   Bar-Facing Burpees  10- 25’ Shuttle runs After each set', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606250002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000078', 'e5000000-0000-4000-8000-202606250002', 1, 'Crossfit (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606250003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-25', 'metcon', 'amrap', 'scaled', 3, 'Performance (AMRAP - Rounds and Reps)
Ascending Ladder (Cap 20)   3-6-9-12-15…  DB Push Press  Up-Downs  10- 25’ Shuttle runs After each set', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606250003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000079', 'e5000000-0000-4000-8000-202606250003', 1, 'Performance (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606260001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-26', 'metcon', 'amrap', 'rx', 1, 'Crossfit (AMRAP - Rounds and Reps)
6 Rounds  4:00 ON / 2:00 OFF  During each 4:00:  20/16 Cal Bike   10 Single DB box step overs 24/20" 50/35   -Max Rounds in remaining time:  EVEN SETS:  5 Power Cleans 135/95 7 Handstand Push-Ups  ODD SETS:  5 S2OH 135/95  7 Pull ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606260001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000080', 'e5000000-0000-4000-8000-202606260001', 1, 'Crossfit (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606260002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-26', 'metcon', 'amrap', 'scaled', 2, 'Performance (AMRAP - Rounds and Reps)
6 Rounds  4:00 ON / 2:00 OFF  During each 4:00:  :75 Bike for calories    10 Single DB box step overs    -Max Rounds in remaining time:  EVEN SETS:    5 SB Power Cleans   7 Push-Ups  ODD SETS:  5 SB hang squat cleans  7 Bent over DB rows', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606260002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000081', 'e5000000-0000-4000-8000-202606260002', 1, 'Performance (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606270001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-06-27', 'metcon', 'amrap', 'rx', 1, 'Crossfit (Time ↓ Shorter is Better)
AMRAP 40   Teams of 2   *One partner works at a time unless noted  Buy-In Together: 2000m Row  Then:  120 Wall Balls 20/14   100 Toes-to-Bar   80 Hang Power Cleans 115/80   60 Burpee Box Jump Overs 24/20   40 Shoulder-to-Overhead 135/95   20 Synchro Alt Devil Presses 50/35  Then with remaining time: Max Calories on Echo Bike', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606270001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000082', 'e5000000-0000-4000-8000-202606270001', 1, 'Crossfit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202606270002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-06-27', 'metcon', 'amrap', 'scaled', 2, 'Performance (Time ↓ Shorter is Better)
AMRAP 40   Teams of 2   *One partner works at a time unless noted  Buy-In Together: 1600m Row  Then:  120 Wall Ball    100 V-Ups   80 DB Hang Cleans   60 Burpee Box Step Overs  40 DB Push Press   20 Synchro Alt Devils Press  Then with remaining time: Max Calories on Bike', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202606270002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000083', 'e5000000-0000-4000-8000-202606270002', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607040001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-04', 'metcon', 'for_time', 'scaled', 1, 'Performance "The Seven" (Time ↓ Shorter is Better)
7 Rounds  14 Push-Ups  14 DB Thrusters  14 V-Ups  14 KB Deadlifts  14 Burpees  14 KB Swings  14 Ring Rows  Then….  Sand bag carry to the 45 minute mark', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607040001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000084', 'e5000000-0000-4000-8000-202607040001', 1, 'Performance "The Seven" (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607060001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Front Squat', '2026-07-06', 'weightlifting', 'strength', 'rx', 1, 'Front Squat (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607060001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000085', 'e5000000-0000-4000-8000-202607060001', (select id from public.benchmark_type where name = 'Front Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Front Squat' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607060002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-06', 'metcon', 'for_time', 'rx', 2, 'CrossFit (5 Rounds for time ↓ shorter is better)
Every 4 minutes x 5 sets  15/12 Cal Bike  12 Front squats 135/95  9 Handstand Push-Ups  6 Burpee Box Jump Overs 24/20', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607060002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000086', 'e5000000-0000-4000-8000-202607060002', 1, 'CrossFit (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607060003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-06', 'metcon', 'for_time', 'scaled', 3, 'Performance (5 Rounds for time ↓ shorter is better)
Every 4 minutes x 5 sets  :45 Bike for calories   12 DB Reverse Lunges  12 Push-Ups  6 Burpee box Step Overs', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607060003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000087', 'e5000000-0000-4000-8000-202607060003', 1, 'Performance (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607070001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-07', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
5 Rounds For Time  250/200m row  12 Deadlifts 225/155  10 T2B  8 Dbl DB thrusters 50s/35s', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607070001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000088', 'e5000000-0000-4000-8000-202607070001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607070002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-07', 'metcon', 'for_time', 'scaled', 2, 'Performance (Time ↓ Shorter is Better)
5 Rounds For Time  250/200m row  12 Dbl DB deadlifts  10 v-ups  8 Dbl DB thrusters', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607070002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000089', 'e5000000-0000-4000-8000-202607070002', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607080001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Hang Clean', '2026-07-08', 'weightlifting', 'strength', 'rx', 1, 'Hang Clean (1 X 1)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607080001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000090', 'e5000000-0000-4000-8000-202607080001', (select id from public.benchmark_type where name = 'Hang Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Hang Clean' and bd.rep_count = 1), 1, 1, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607080002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-08', 'metcon', 'for_time', 'rx', 2, 'CrossFIt (5 Rounds for time ↓ shorter is better)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607080002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000091', 'e5000000-0000-4000-8000-202607080002', 1, 'CrossFIt (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607080003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-08', 'metcon', 'for_time', 'scaled', 3, 'Performance (5 Rounds for time ↓ shorter is better)
Every 4 Minutes x 5 Sets  1 minute Ski   12 DB power Cleans   10 Alt db hang power snatches  4 Wall walks', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607080003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000092', 'e5000000-0000-4000-8000-202607080003', 1, 'Performance (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607090001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Snatch', '2026-07-09', 'weightlifting', 'strength', 'rx', 1, 'Snatch (1 X 1)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607090001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000093', 'e5000000-0000-4000-8000-202607090001', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 1), 1, 1, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607090002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-09', 'metcon', 'for_time', 'rx', 2, 'CrossFit (Time ↓ Shorter is Better)
18-15-12-9-6-3  Front Squats 135/95  Bar Facing Burpees  After each round:  300m run', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607090002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000094', 'e5000000-0000-4000-8000-202607090002', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607090003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-09', 'metcon', 'for_time', 'scaled', 3, 'Performance (Time ↓ Shorter is Better)
18-15-12-9-6-3  DB Front Squats  Up-Downs  After each round:  300m run', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607090003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000095', 'e5000000-0000-4000-8000-202607090003', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607100001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-10', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
1200m Run  Then:  5 Rounds  15/12 Cal Bike   12 Hang Power Cleans 135/95   9 Handstand Push-Ups  Then:  800m Run  Then:  3 Rounds   12 Burpee over the bar  12 Shoulder-to-Overhead 135/95  12 Chest-to-Bar Pull-Ups', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607100001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000096', 'e5000000-0000-4000-8000-202607100001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607100002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-10', 'metcon', 'for_time', 'scaled', 2, 'Performance (Time ↓ Shorter is Better)
1000m Run  Then:  5 Rounds  1 minute Cal Bike  15 DB Hang Cleans  12 Push-Ups  Then:  800m Run  Then:  3 Rounds  12 Up-Downs  12 DB Push Press  12 Ring Rows', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607100002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000097', 'e5000000-0000-4000-8000-202607100002', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607110001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-11', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
Teams of 2- 42 min cap  You Go, I Go- FInish Each Movement before switching:  80/60 cal Row  Then…  80 T2B  70 DL 225/155  60 Box Jump Overs 24/20  50 S2OH 135/95  Then…  80/60 cal Row', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607110001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000098', 'e5000000-0000-4000-8000-202607110001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607110002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-11', 'metcon', 'for_time', 'scaled', 2, 'Performance (Time ↓ Shorter is Better)
Teams of 2- 42 min cap  You Go, I Go- FInish Each Movement before switching:  5 min Row for Cals  Then…  70 Ring Rows  60 KB DL  50 Box Step/Vault Overs  40 DB Push Press  Then…  5 min Row for Cals', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607110002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000099', 'e5000000-0000-4000-8000-202607110002', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607130001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Back Squat', '2026-07-13', 'weightlifting', 'strength', 'rx', 1, 'Back Squat (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607130001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000100', 'e5000000-0000-4000-8000-202607130001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607130002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-13', 'metcon', 'amrap', 'rx', 2, 'CrossFit (AMRAP - Reps)
4 Sets   4:00 ON / 2:00 OFF   20/16 Cal Echo Bike    15 Deadlifts 225/155    Max Box Jump Overs 24/20   Score = total box jump overs', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607130002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000101', 'e5000000-0000-4000-8000-202607130002', 1, 'CrossFit (AMRAP - Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607130003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-13', 'metcon', 'amrap', 'scaled', 3, 'Performance (AMRAP - Reps)
3 Sets    4:00 ON / 2:00 OFF   :90 Bike for calories   20 KBS   Max Burpee box step overs   Score = total step overs', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607130003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000102', 'e5000000-0000-4000-8000-202607130003', 1, 'Performance (AMRAP - Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607140001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Push Press', '2026-07-14', 'weightlifting', 'strength', 'rx', 1, 'Push Press (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607140001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000103', 'e5000000-0000-4000-8000-202607140001', (select id from public.benchmark_type where name = 'Push Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Push Press' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607140002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-14', 'metcon', 'for_time', 'rx', 2, 'CrossFit (Time ↓ Shorter is Better)
For Time (Cap 18)   21-18-15-12-9   C2B   Calories on Row   After each round:    5 Clean and Jerks 185/95', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607140002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000104', 'e5000000-0000-4000-8000-202607140002', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607140003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-14', 'metcon', 'for_time', 'scaled', 3, 'Performance (Time ↓ Shorter is Better)
For Time (Cap 18)   21-18-15-12-9   Ring Rows   Calories on Row   After each round:    8 Dbl DB squat clean thrusters', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607140003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000105', 'e5000000-0000-4000-8000-202607140003', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607150001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Hang Snatch', '2026-07-15', 'weightlifting', 'strength', 'rx', 1, 'Hang Snatch (1 X 1)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607150001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000106', 'e5000000-0000-4000-8000-202607150001', (select id from public.benchmark_type where name = 'Hang Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Hang Snatch' and bd.rep_count = 1), 1, 1, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607150002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-15', 'metcon', 'for_time', 'rx', 2, 'CrossFit (Time ↓ Shorter is Better)
5 rounds   10 Front Squats 135/95    12 HSPU    14/12 Cal Ski   16 Alt DB hang snatches 50/35', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607150002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000107', 'e5000000-0000-4000-8000-202607150002', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607160001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-16', 'metcon', 'for_time', 'rx', 1, 'CrossFit (7 Rounds for time ↓ shorter is better)
Every 3 minute x 7   8 Hang power cleans 135/95    10 Bar Facing Burpees   200m Run', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607160001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000108', 'e5000000-0000-4000-8000-202607160001', 1, 'CrossFit (7 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607170001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-17', 'metcon', 'amrap', 'rx', 1, 'CrossFit (AMRAP - Rounds and Reps)
6 Rounds 5:00 ON / 2:00 OFF   During each 5:00   25/20 Cal row    Then max rounds:   5 Shoulder-to-Overhead 135/95    7 Toes-to-Bar    9 Box Jump Overs 24/20   Score = total rounds + reps', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607170001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000109', 'e5000000-0000-4000-8000-202607170001', 1, 'CrossFit (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607170002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-17', 'metcon', 'amrap', 'scaled', 2, 'Performance (AMRAP - Rounds and Reps)
6 rounds   5:00 ON / 2:00 OFF   During each 5:00   :90 Row for calories   Then max rounds:   8 DB Push Press    8 V-Ups    10 single DB Box Step Overs   Score = total rounds + reps', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607170002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000110', 'e5000000-0000-4000-8000-202607170002', 1, 'Performance (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607180001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-18', 'metcon', 'amrap', 'rx', 1, 'CrossFit (AMRAP - Reps)
CROSSFIT – PARTNER   Teams of 2    AMRAP 38   Buy-In Together: 2000m Row   Then:   100 Wall Balls 20/14    80 Hang Power Snatches 95/65   60 Burpee Box Jump Overs 240/20   40 Chest-to-Bar Pull-Ups   20 Squat clean thrusters 155/105   Then with remaining time:   Max Calories on Echo Bike   Score = total bike calories   *You can also get a calorie for every EXTRA squat clean thruster you do.', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607180001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000111', 'e5000000-0000-4000-8000-202607180001', 1, 'CrossFit (AMRAP - Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607180002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-18', 'metcon', 'amrap', 'scaled', 2, 'Performance (AMRAP - Reps)
Teams of 2   AMRAP 38   Buy-In Together:    8:00 row for max meters   Then:   100 Wall Balls    80 Alt DB Snatches   60 Burpee Step Overs   40 Ring Rows    20 Dbl DB squat clean thrusters   Then with remaining time: Max Calories on Bike/skierg   Score = total bike calories   *You can also get a calorie for every EXTRA squat clean thruster you do', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607180002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000112', 'e5000000-0000-4000-8000-202607180002', 1, 'Performance (AMRAP - Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607200001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Back Squat', '2026-07-20', 'weightlifting', 'strength', 'rx', 1, 'Back Squat (1 X 2)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607200001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000113', 'e5000000-0000-4000-8000-202607200001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 2), 1, 2, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607200002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-20', 'metcon', 'for_time', 'rx', 2, 'CrossFit (6 Rounds for time ↓ shorter is better)
6 Rounds   2:30  Work :90 Rest  During each work period:  12/10 Cal Row  10 Dbl DB Devil Press 50/35  Max Shuttle Runs (25'')  Score = Shuttle Runs', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607200002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000114', 'e5000000-0000-4000-8000-202607200002', 1, 'CrossFit (6 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607200003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-20', 'metcon', 'for_time', 'scaled', 3, 'Performance (6 Rounds for time ↓ shorter is better)
6 Rounds  2:30  Work :90 Rest  :45 Cal Row  10 Alt DB Devil Press  Max Shuttle Runs (25'')', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607200003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000115', 'e5000000-0000-4000-8000-202607200003', 1, 'Performance (6 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607210001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Bench Press', '2026-07-21', 'weightlifting', 'strength', 'rx', 1, 'Bench Press (1 X 3)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607210001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000116', 'e5000000-0000-4000-8000-202607210001', (select id from public.benchmark_type where name = 'Bench Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Bench Press' and bd.rep_count = 3), 1, 3, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607210002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-21', 'metcon', 'amrap', 'rx', 2, 'CrossFit (AMRAP - Rounds and Reps)
21 Minute AMRAP   9 Deadlifts 225/155  15 HSPU  21/16 Cal Bike', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607210002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000117', 'e5000000-0000-4000-8000-202607210002', 1, 'CrossFit (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607210003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-21', 'metcon', 'amrap', 'scaled', 3, 'Performance (AMRAP - Rounds and Reps)
21 Minute AMRAP  9 KB Deadlifts  12 DB KB thruster  :60 Cal Bike', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607210003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000118', 'e5000000-0000-4000-8000-202607210003', 1, 'Performance (AMRAP - Rounds and Reps)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607220001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Clean', '2026-07-22', 'weightlifting', 'strength', 'rx', 1, 'Clean (1 X 1)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607220001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000119', 'e5000000-0000-4000-8000-202607220001', (select id from public.benchmark_type where name = 'Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Clean' and bd.rep_count = 1), 1, 1, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607220002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-22', 'metcon', 'for_time', 'rx_plus', 2, 'CrossFit (Time ↓ Shorter is Better)
10 rounds   10 KBS 53/35  25’ lunge down with KB in Right FR  25’ lunge down with KB in Left FR  RX+= 70/53', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607220002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000120', 'e5000000-0000-4000-8000-202607220002', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607220003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-22', 'metcon', 'for_time', 'scaled', 3, 'Performance (5 Rounds for time ↓ shorter is better)
5 Rounds  400m Row  15 Box Step Overs  Rest 1:00', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607220003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000121', 'e5000000-0000-4000-8000-202607220003', 1, 'Performance (5 Rounds for time ↓ shorter is better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607230001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Shoulder Press', '2026-07-23', 'weightlifting', 'strength', 'rx', 1, 'Shoulder Press (1 X 5)', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607230001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('f5000000-0000-4000-8000-000000000122', 'e5000000-0000-4000-8000-202607230001', (select id from public.benchmark_type where name = 'Strict Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Strict Press' and bd.rep_count = 5), 1, 5, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607230002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-23', 'metcon', 'for_time', 'rx', 2, 'Crossfit (Time ↓ Shorter is Better)
For Time (Cap 20)   100-80-60-40-20  Double Unders   After each set:   5 Power Cleans  115/75  135/95  155/105  185/125  205/135  Rest 1 minute between', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607230002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000123', 'e5000000-0000-4000-8000-202607230002', 1, 'Crossfit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607230003', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-23', 'metcon', 'for_time', 'scaled', 3, 'Performance (Time ↓ Shorter is Better)
For Time (Cap 20)   100-80-60-40-20  Single Unders   After each set:   8 DB Hang Cleans  200’ Farmers carry', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607230003', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000124', 'e5000000-0000-4000-8000-202607230003', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607240001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'The Climb', '2026-07-24', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
"The Climb"   600m Run  12 Shoulder-to-Overhead 135/95  12 Pull ups  12 Burpee Over Bar   Rest 1:00      600m Run  12 Squat cleans 135/95  12 Chest-to-Bar Pull-Ups  12 Burpee to a 6” target   Rest 1:00      600m Run  12 Squat snatches 135/95  12 Bar muscle ups  12 Burpee Pull ups   Rest 1:00      600m Run  12 Thrusters 135/95  12 muscle ups  12 Burpee box jump overs 24/20', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607240001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000125', 'e5000000-0000-4000-8000-202607240001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607240002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-24', 'metcon', 'for_time', 'scaled', 2, 'Performance (Time ↓ Shorter is Better)
4 Rounds  500m Run  12 DB Push Press  12 Ring Rows  12 Burpee wall kick ups  Rest 1:00 between Rds', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607240002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000126', 'e5000000-0000-4000-8000-202607240002', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607250001', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon', '2026-07-25', 'metcon', 'for_time', 'rx', 1, 'CrossFit (Time ↓ Shorter is Better)
Teams of 2   For Time (Cap 45)   100 Cal Bike  Then Partition how you would like with 1 partner working at a time.  120 Wallballs 20/14  60 Deadlifts 225/155  400’ HSW/400m Farmers carry  20 Rope Climbs  Then  100 Cal Row  Partners split work however desired.', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607250001', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000127', 'e5000000-0000-4000-8000-202607250001', 1, 'CrossFit (Time ↓ Shorter is Better)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('e5000000-0000-4000-8000-202607250002', (select id from public.gym where name ilike 'Triad Training' limit 1), (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1), 'Metcon (Scaled)', '2026-07-25', 'metcon', 'for_time', 'scaled', 2, 'Performance (Time ↓ Shorter is Better)
Teams of 2   For Time (Cap 45)   4 minute Row for Calories  Then…  80 Ring Rows  60 KB Deadlifts  40 Push-Ups  20 Wall Walks  Then…  4 minute Bike for Calories', 'gym', null);
insert into public.programming_library_assignment (programming_id, program_library_id)
values ('e5000000-0000-4000-8000-202607250002', (select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)) on conflict do nothing;
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f5000000-0000-4000-8000-000000000128', 'e5000000-0000-4000-8000-202607250002', 1, 'Performance (Time ↓ Shorter is Better)', 'pending');

alter table public.programming enable trigger programming_update_guard;
alter table public.programming_line_item enable trigger pli_update_guard;
commit;