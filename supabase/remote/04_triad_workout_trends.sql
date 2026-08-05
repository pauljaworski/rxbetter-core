-- Triad Workout Trends: programming + line items + Paul performances
alter table public.programming disable trigger programming_update_guard;
alter table public.programming_line_item disable trigger pli_update_guard;

delete from public.athlete_performance where programming_id in (
  select id from public.programming where gym_id = 'a0000000-0000-4000-8000-000000000001' and id::text like 'e3000000%'
);
delete from public.programming_line_item where programming_id in (
  select id from public.programming where gym_id = 'a0000000-0000-4000-8000-000000000001' and id::text like 'e3000000%'
);
delete from public.programming where gym_id = 'a0000000-0000-4000-8000-000000000001' and id::text like 'e3000000%';

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603160001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x5 (65,70,75,75,75%)', '2026-03-16', 'weightlifting', 'rx', 1, 'Back Squat 5x5 (65,70,75,75,75%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603160001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 5, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000002', 'e3000000-0000-4000-8000-202603160001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 5, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000003', 'e3000000-0000-4000-8000-202603160001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 5, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000004', 'e3000000-0000-4000-8000-202603160001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 5, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000005', 'e3000000-0000-4000-8000-202603160001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 5, 0.75, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603160001', 'f3000000-0000-4000-8000-000000000005', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 5), '2026-03-16', 'completed', '215', 215, 5, 0.75, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603160002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4RFT: 400m Run, 21 Wall Balls, 15 Pull-ups, 9 DL (185lbs)', '2026-03-16', 'metcon', 'for_time', 'rx', 2, '4RFT: 400m Run, 21 Wall Balls, 15 Pull-ups, 9 DL (185lbs)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000006', 'e3000000-0000-4000-8000-202603160002', null, 1, '4RFT: 400m Run, 21 Wall Balls, 15 Pull-ups, 9 DL (185lbs)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603160002', 'f3000000-0000-4000-8000-000000000006', null, '2026-03-16', 'completed', '16:48', 1008, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603170001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press 5x4 (65,70,75,75,80%)', '2026-03-17', 'weightlifting', 'rx', 1, 'Bench Press 5x4 (65,70,75,75,80%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000007', 'e3000000-0000-4000-8000-202603170001', (select id from public.benchmark_type where name = 'Bench Press'), 1, 4, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000008', 'e3000000-0000-4000-8000-202603170001', (select id from public.benchmark_type where name = 'Bench Press'), 2, 4, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000009', 'e3000000-0000-4000-8000-202603170001', (select id from public.benchmark_type where name = 'Bench Press'), 3, 4, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000010', 'e3000000-0000-4000-8000-202603170001', (select id from public.benchmark_type where name = 'Bench Press'), 4, 4, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000011', 'e3000000-0000-4000-8000-202603170001', (select id from public.benchmark_type where name = 'Bench Press'), 5, 4, 0.8, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603170002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3 minutes for 6 sets', '2026-03-17', 'metcon', 'for_time', 'rx', 2, 'Every 3 minutes for 6 sets: 15 Cal Bike, 12 T2B, 9 Push Press (135lbs)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000012', 'e3000000-0000-4000-8000-202603170002', null, 1, 'Every 3 minutes for 6 sets: 15 Cal Bike, 12 T2B, 9 Push Press (135lbs)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603180001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (6x2) TnG (75-85%)', '2026-03-18', 'weightlifting', 'rx', 1, 'Power Clean (6x2) TnG (75-85%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000013', 'e3000000-0000-4000-8000-202603180001', (select id from public.benchmark_type where name = 'Power Clean'), 1, 2, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000014', 'e3000000-0000-4000-8000-202603180001', (select id from public.benchmark_type where name = 'Power Clean'), 2, 2, 0.77, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000015', 'e3000000-0000-4000-8000-202603180001', (select id from public.benchmark_type where name = 'Power Clean'), 3, 2, 0.79, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000016', 'e3000000-0000-4000-8000-202603180001', (select id from public.benchmark_type where name = 'Power Clean'), 4, 2, 0.8099999999999999, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000017', 'e3000000-0000-4000-8000-202603180001', (select id from public.benchmark_type where name = 'Power Clean'), 5, 2, 0.83, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000018', 'e3000000-0000-4000-8000-202603180001', (select id from public.benchmark_type where name = 'Power Clean'), 6, 2, 0.85, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603180001', 'f3000000-0000-4000-8000-000000000018', (select id from public.benchmark_type where name = 'Power Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Clean' and bd.rep_count = 2), '2026-03-18', 'completed', '225', 225, 2, 0.85, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603180002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '21-15-9', '2026-03-18', 'metcon', 'for_time', 'rx', 2, '21-15-9: Burpees over Bar, Front Squat (135 lbs), Cal Ski', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000019', 'e3000000-0000-4000-8000-202603180002', null, 1, '21-15-9: Burpees over Bar, Front Squat (135 lbs), Cal Ski', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603180002', 'f3000000-0000-4000-8000-000000000019', null, '2026-03-18', 'completed', '7:59', 479, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603190001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift 6x3 (60,65,70,75,80,85%)', '2026-03-19', 'weightlifting', 'rx', 1, 'Deadlift 6x3 (60,65,70,75,80,85%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000020', 'e3000000-0000-4000-8000-202603190001', (select id from public.benchmark_type where name = 'Deadlift'), 1, 3, 0.6, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000021', 'e3000000-0000-4000-8000-202603190001', (select id from public.benchmark_type where name = 'Deadlift'), 2, 3, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000022', 'e3000000-0000-4000-8000-202603190001', (select id from public.benchmark_type where name = 'Deadlift'), 3, 3, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000023', 'e3000000-0000-4000-8000-202603190001', (select id from public.benchmark_type where name = 'Deadlift'), 4, 3, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000024', 'e3000000-0000-4000-8000-202603190001', (select id from public.benchmark_type where name = 'Deadlift'), 5, 3, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000025', 'e3000000-0000-4000-8000-202603190001', (select id from public.benchmark_type where name = 'Deadlift'), 6, 3, 0.85, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603190002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-03-19', 'metcon', 'emom', 'rx', 2, 'EMOM 20: 1: 14 Cal Row, 2: 16 ALt DB Snatch (50 lbs), 3: 8 BBJO''s (24), 4: 12 HSPU', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000026', 'e3000000-0000-4000-8000-202603190002', null, 1, 'EMOM 20: 1: 14 Cal Row, 2: 16 ALt DB Snatch (50 lbs), 3: 8 BBJO''s (24), 4: 12 HSPU', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603200001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For Time', '2026-03-20', 'metcon', 'for_time', 'rx', 1, 'For Time: 800m Run, 60 KB Swings (53lbs), 50 Sit-ups, 40 Dbl DB Walking Lunges (50s), 40 Cal Bike, 30 Thursters (95lbs), 20 DB Box Step Overs (24, 50s), 10 BMU, 40 Cal Row', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000027', 'e3000000-0000-4000-8000-202603200001', null, 1, 'For Time: 800m Run, 60 KB Swings (53lbs), 50 Sit-ups, 40 Dbl DB Walking Lunges (50s), 40 Cal Bike, 30 Thursters (95lbs), 20 DB Box Step Overs (24, 50s), 10 BMU, 40 Cal Row', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603210001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 40 (Temas of 2,1 works, 1 rests)', '2026-03-21', 'metcon', 'amrap', 'rx', 1, 'AMRAP 40 (Temas of 2,1 works, 1 rests): 1500m Row, 120 Wall Balls, 90 DB Hang Snatches (50lbs), 60 BBJO''s, 30 Burpee Pull-ups', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000028', 'e3000000-0000-4000-8000-202603210001', null, 1, 'AMRAP 40 (Temas of 2,1 works, 1 rests): 1500m Row, 120 Wall Balls, 90 DB Hang Snatches (50lbs), 60 BBJO''s, 30 Burpee Pull-ups', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603210001', 'f3000000-0000-4000-8000-000000000028', null, '2026-03-21', 'completed', '2+1200 Rx', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603230001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x5 (60,65,70,75,78%)', '2026-03-23', 'weightlifting', 'rx', 1, 'Back Squat 5x5 (60,65,70,75,78%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000029', 'e3000000-0000-4000-8000-202603230001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 5, 0.6, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000030', 'e3000000-0000-4000-8000-202603230001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 5, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000031', 'e3000000-0000-4000-8000-202603230001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 5, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000032', 'e3000000-0000-4000-8000-202603230001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 5, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000033', 'e3000000-0000-4000-8000-202603230001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 5, 0.78, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603230001', 'f3000000-0000-4000-8000-000000000033', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 5), '2026-03-23', 'completed', '335', 335, 5, 0.78, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603230002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-03-23', 'metcon', 'for_time', 'rx', 2, 'Every 3:30 x 5 sets: 15 Cal Row, 13 T2B, 11 Hang Power Cleans (135lbs)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000034', 'e3000000-0000-4000-8000-202603230002', null, 1, 'Every 3:30 x 5 sets: 15 Cal Row, 13 T2B, 11 Hang Power Cleans (135lbs)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603230002', 'f3000000-0000-4000-8000-000000000034', null, '2026-03-23', 'completed', '7:52', 472, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603240001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press 5x4 (65,70,75,77.5,80%)', '2026-03-24', 'weightlifting', 'rx', 1, 'Bench Press 5x4 (65,70,75,77.5,80%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000035', 'e3000000-0000-4000-8000-202603240001', (select id from public.benchmark_type where name = 'Bench Press'), 1, 4, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000036', 'e3000000-0000-4000-8000-202603240001', (select id from public.benchmark_type where name = 'Bench Press'), 2, 4, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000037', 'e3000000-0000-4000-8000-202603240001', (select id from public.benchmark_type where name = 'Bench Press'), 3, 4, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000038', 'e3000000-0000-4000-8000-202603240001', (select id from public.benchmark_type where name = 'Bench Press'), 4, 4, 0.775, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000039', 'e3000000-0000-4000-8000-202603240001', (select id from public.benchmark_type where name = 'Bench Press'), 5, 4, 0.8, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603240001', 'f3000000-0000-4000-8000-000000000039', (select id from public.benchmark_type where name = 'Bench Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Bench Press' and bd.rep_count = 4), '2026-03-24', 'completed', '225', 225, 4, 0.8, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603240002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4 RFT: 400m Run, 15 KB Swings (70lbs), 12 BBJO, 9 Cal Ski', '2026-03-24', 'metcon', 'for_time', 'rx', 2, '4 RFT: 400m Run, 15 KB Swings (70lbs), 12 BBJO, 9 Cal Ski', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000040', 'e3000000-0000-4000-8000-202603240002', null, 1, '4 RFT: 400m Run, 15 KB Swings (70lbs), 12 BBJO, 9 Cal Ski', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603240002', 'f3000000-0000-4000-8000-000000000040', null, '2026-03-24', 'completed', '19:00', 1140, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603250001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (7x2) (70,70,75,80,80,82.5,85%)', '2026-03-25', 'weightlifting', 'rx', 1, 'Power Clean (7x2) (70,70,75,80,80,82.5,85%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000041', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 1, 2, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000042', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 2, 2, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000043', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 3, 2, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000044', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 4, 2, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000045', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 5, 2, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000046', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 6, 2, 0.825, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000047', 'e3000000-0000-4000-8000-202603250001', (select id from public.benchmark_type where name = 'Power Clean'), 7, 2, 0.85, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603250002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-03-25', 'metcon', 'emom', 'rx', 2, 'EMOM 20: 1: 0:40 Cal Row, 2: 10 S2OH, 3: 15 Pull-ups, 4: 50'' HSW', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000048', 'e3000000-0000-4000-8000-202603250002', null, 1, 'EMOM 20: 1: 0:40 Cal Row, 2: 10 S2OH, 3: 15 Pull-ups, 4: 50'' HSW', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603260001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front Squat with a 2 second pause on rep 1 (5x2) (70,75,80,82.5,85%)', '2026-03-26', 'weightlifting', 'rx', 1, 'Front Squat with a 2 second pause on rep 1 (5x2) (70,75,80,82.5,85%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000049', 'e3000000-0000-4000-8000-202603260001', (select id from public.benchmark_type where name = 'Front Squat'), 1, 2, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000050', 'e3000000-0000-4000-8000-202603260001', (select id from public.benchmark_type where name = 'Front Squat'), 2, 2, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000051', 'e3000000-0000-4000-8000-202603260001', (select id from public.benchmark_type where name = 'Front Squat'), 3, 2, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000052', 'e3000000-0000-4000-8000-202603260001', (select id from public.benchmark_type where name = 'Front Squat'), 4, 2, 0.825, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000053', 'e3000000-0000-4000-8000-202603260001', (select id from public.benchmark_type where name = 'Front Squat'), 5, 2, 0.85, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603260002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2RFT: 70 Double Unders, 50 Sit-ups, 30 Box Jump Overs, 20 Alt DB Hang Squat Clea', '2026-03-26', 'metcon', 'for_time', 'rx', 2, '2RFT: 70 Double Unders, 50 Sit-ups, 30 Box Jump Overs, 20 Alt DB Hang Squat Clean Thrusters (50lbs)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000054', 'e3000000-0000-4000-8000-202603260002', null, 1, '2RFT: 70 Double Unders, 50 Sit-ups, 30 Box Jump Overs, 20 Alt DB Hang Squat Clean Thrusters (50lbs)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603270001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 15 Cal Bike, 20 Wallballs, 15 Cal Ski, 20 DB Front Rack Walking Lunges (5', '2026-03-27', 'metcon', 'for_time', 'rx', 1, '5 RFT: 15 Cal Bike, 20 Wallballs, 15 Cal Ski, 20 DB Front Rack Walking Lunges (50s), 15 Cal Row', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000055', 'e3000000-0000-4000-8000-202603270001', null, 1, '5 RFT: 15 Cal Bike, 20 Wallballs, 15 Cal Ski, 20 DB Front Rack Walking Lunges (50s), 15 Cal Row', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603280001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 For Time', '2026-03-28', 'metcon', 'for_time', 'rx', 1, 'Teams of 2 For Time: 200 Cal Echo BIke. 160 Hang Power Cleans (115lbs), 120 Bar Facing Burpees, 80 HSPU, 40 BMU', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000056', 'e3000000-0000-4000-8000-202603280001', null, 1, 'Teams of 2 For Time: 200 Cal Echo BIke. 160 Hang Power Cleans (115lbs), 120 Bar Facing Burpees, 80 HSPU, 40 BMU', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603300001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x5 (62,67,72,77,80%)', '2026-03-30', 'weightlifting', 'rx', 1, 'Back Squat 5x5 (62,67,72,77,80%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000057', 'e3000000-0000-4000-8000-202603300001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 5, 0.62, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000058', 'e3000000-0000-4000-8000-202603300001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 5, 0.67, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000059', 'e3000000-0000-4000-8000-202603300001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 5, 0.72, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000060', 'e3000000-0000-4000-8000-202603300001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 5, 0.77, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000061', 'e3000000-0000-4000-8000-202603300001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 5, 0.8, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603300002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Everty 3', '2026-03-30', 'metcon', 'for_time', 'rx', 2, 'Everty 3:30 x 5 Sets: 20 Cal Bike, 10 C2B, 10 OHS (95lbs)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000062', 'e3000000-0000-4000-8000-202603300002', null, 1, 'Everty 3:30 x 5 Sets: 20 Cal Bike, 10 C2B, 10 OHS (95lbs)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603310001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press 5x4 (67,72,77,80,82.5%)', '2026-03-31', 'weightlifting', 'rx', 1, 'Bench Press 5x4 (67,72,77,80,82.5%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000063', 'e3000000-0000-4000-8000-202603310001', (select id from public.benchmark_type where name = 'Bench Press'), 1, 4, 0.67, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000064', 'e3000000-0000-4000-8000-202603310001', (select id from public.benchmark_type where name = 'Bench Press'), 2, 4, 0.72, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000065', 'e3000000-0000-4000-8000-202603310001', (select id from public.benchmark_type where name = 'Bench Press'), 3, 4, 0.77, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000066', 'e3000000-0000-4000-8000-202603310001', (select id from public.benchmark_type where name = 'Bench Press'), 4, 4, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000067', 'e3000000-0000-4000-8000-202603310001', (select id from public.benchmark_type where name = 'Bench Press'), 5, 4, 0.825, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603310001', 'f3000000-0000-4000-8000-000000000067', (select id from public.benchmark_type where name = 'Bench Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Bench Press' and bd.rep_count = 4), '2026-03-31', 'completed', '235', 235, 4, 0.825, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603310002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4 RFT: 400m RUN, 20 Wallballs, 16 Alt DB Hang Snatches (50lbs), 10 Burpee Box Ju', '2026-03-31', 'metcon', 'for_time', 'rx', 2, '4 RFT: 400m RUN, 20 Wallballs, 16 Alt DB Hang Snatches (50lbs), 10 Burpee Box Jump Overs', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000068', 'e3000000-0000-4000-8000-202603310002', null, 1, '4 RFT: 400m RUN, 20 Wallballs, 16 Alt DB Hang Snatches (50lbs), 10 Burpee Box Jump Overs', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603310002', 'f3000000-0000-4000-8000-000000000068', null, '2026-03-31', 'completed', '21:19', 1279, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604010001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (7x2) (75,75,80,82.5,85,87%)', '2026-04-01', 'weightlifting', 'rx', 1, 'Power Clean (7x2) (75,75,80,82.5,85,87%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000069', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 1, 2, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000070', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 2, 2, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000071', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 3, 2, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000072', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 4, 2, 0.825, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000073', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 5, 2, 0.85, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000074', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 6, 2, 0.87, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000075', 'e3000000-0000-4000-8000-202604010001', (select id from public.benchmark_type where name = 'Power Clean'), 7, 2, 0.87, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604010001', 'f3000000-0000-4000-8000-000000000075', (select id from public.benchmark_type where name = 'Power Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Clean' and bd.rep_count = 2), '2026-04-01', 'completed', '275', 275, 2, 0.87, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604010002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 10 minutes x 2', '2026-04-01', 'metcon', 'for_time', 'rx', 2, 'Every 10 minutes x 2: 100 Double Unders, 40 Cal SKI, 20 Devils Press (2x50lbs), 10 Box Get Overs 40', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000076', 'e3000000-0000-4000-8000-202604010002', null, 1, 'Every 10 minutes x 2: 100 Double Unders, 40 Cal SKI, 20 Devils Press (2x50lbs), 10 Box Get Overs 40', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604010002', 'f3000000-0000-4000-8000-000000000076', null, '2026-04-01', 'completed', '15:21', 921, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604020001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front Squat with a 2 second pause on rep 1 (5x2) (72,77,82,85,87%)', '2026-04-02', 'weightlifting', 'rx', 1, 'Front Squat with a 2 second pause on rep 1 (5x2) (72,77,82,85,87%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000077', 'e3000000-0000-4000-8000-202604020001', (select id from public.benchmark_type where name = 'Front Squat'), 1, 2, 0.72, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000078', 'e3000000-0000-4000-8000-202604020001', (select id from public.benchmark_type where name = 'Front Squat'), 2, 2, 0.77, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000079', 'e3000000-0000-4000-8000-202604020001', (select id from public.benchmark_type where name = 'Front Squat'), 3, 2, 0.82, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000080', 'e3000000-0000-4000-8000-202604020001', (select id from public.benchmark_type where name = 'Front Squat'), 4, 2, 0.85, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000081', 'e3000000-0000-4000-8000-202604020001', (select id from public.benchmark_type where name = 'Front Squat'), 5, 2, 0.87, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604020001', 'f3000000-0000-4000-8000-000000000081', (select id from public.benchmark_type where name = 'Front Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Front Squat' and bd.rep_count = 2), '2026-04-02', 'completed', '325', 325, 2, 0.87, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604020002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-04-02', 'metcon', 'emom', 'rx', 2, 'EMOM 20: 1: 0:40 Cal Row, 2: 8 Clean & Jerks (135lbs), 3: 0:40 Max T2B, 4: 50'' HSW', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000082', 'e3000000-0000-4000-8000-202604020002', null, 1, 'EMOM 20: 1: 0:40 Cal Row, 2: 8 Clean & Jerks (135lbs), 3: 0:40 Max T2B, 4: 50'' HSW', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604020002', 'f3000000-0000-4000-8000-000000000082', null, '2026-04-02', 'completed', '153 reps', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604030001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For Time', '2026-04-03', 'metcon', 'for_time', 'rx', 1, 'For Time: 1600m Run, 80 Wallballs, 60 T2B, 100'' Double DB Front Rack Walking Lunges (2x50)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000083', 'e3000000-0000-4000-8000-202604030001', null, 1, 'For Time: 1600m Run, 80 Wallballs, 60 T2B, 100'' Double DB Front Rack Walking Lunges (2x50)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604030001', 'f3000000-0000-4000-8000-000000000083', null, '2026-04-03', 'completed', '16:23', 983, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604040001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 - Interval Chipper', '2026-04-04', 'metcon', 'for_time', 'rx', 1, 'Teams of 2 - Interval Chipper: 4 RoundsL 400m Run Together, 30 Hang Power Cleans (115lbs, 30 Bar Facing Burpees, Max Cal Echo Bike, Rest 1 min', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000084', 'e3000000-0000-4000-8000-202604040001', null, 1, 'Teams of 2 - Interval Chipper: 4 RoundsL 400m Run Together, 30 Hang Power Cleans (115lbs, 30 Bar Facing Burpees, Max Cal Echo Bike, Rest 1 min', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604040001', 'f3000000-0000-4000-8000-000000000084', null, '2026-04-04', 'completed', '235 calories', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604060001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x4 (65,70,75,8082.5,82.5%)', '2026-04-06', 'weightlifting', 'rx', 1, 'Back Squat 5x4 (65,70,75,8082.5,82.5%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000085', 'e3000000-0000-4000-8000-202604060001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 4, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000086', 'e3000000-0000-4000-8000-202604060001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 4, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000087', 'e3000000-0000-4000-8000-202604060001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 4, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000088', 'e3000000-0000-4000-8000-202604060001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 4, 80.825, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000089', 'e3000000-0000-4000-8000-202604060001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 4, 0.825, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604060001', 'f3000000-0000-4000-8000-000000000089', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 4), '2026-04-06', 'completed', '350', 350, 4, 0.825, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604060002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-04-06', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18: 15 Cal Ski, 13 Front Squats (115lbs), 11 S2OH, 9 C2B', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000090', 'e3000000-0000-4000-8000-202604060002', null, 1, 'AMRAP 18: 15 Cal Ski, 13 Front Squats (115lbs), 11 S2OH, 9 C2B', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604070001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Push Press (6x3) (70,75,80,82.5,85,85%)', '2026-04-07', 'weightlifting', 'rx', 1, 'Push Press (6x3) (70,75,80,82.5,85,85%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000091', 'e3000000-0000-4000-8000-202604070001', (select id from public.benchmark_type where name = 'Push Press'), 1, 3, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000092', 'e3000000-0000-4000-8000-202604070001', (select id from public.benchmark_type where name = 'Push Press'), 2, 3, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000093', 'e3000000-0000-4000-8000-202604070001', (select id from public.benchmark_type where name = 'Push Press'), 3, 3, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000094', 'e3000000-0000-4000-8000-202604070001', (select id from public.benchmark_type where name = 'Push Press'), 4, 3, 0.825, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000095', 'e3000000-0000-4000-8000-202604070001', (select id from public.benchmark_type where name = 'Push Press'), 5, 3, 0.85, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000096', 'e3000000-0000-4000-8000-202604070001', (select id from public.benchmark_type where name = 'Push Press'), 6, 3, 0.85, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604070001', 'f3000000-0000-4000-8000-000000000096', (select id from public.benchmark_type where name = 'Push Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Push Press' and bd.rep_count = 3), '2026-04-07', 'completed', '255', 255, 3, 0.85, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604070002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5RFT: 300m Run, 20 Wallballs, 10 HSPU', '2026-04-07', 'metcon', 'for_time', 'rx', 2, '5RFT: 300m Run, 20 Wallballs, 10 HSPU', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000097', 'e3000000-0000-4000-8000-202604070002', null, 1, '5RFT: 300m Run, 20 Wallballs, 10 HSPU', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604070002', 'f3000000-0000-4000-8000-000000000097', null, '2026-04-07', 'completed', '14:43', 883, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604080001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (7x2) (75,80,82.5,85,87,87,90%)', '2026-04-08', 'weightlifting', 'rx', 1, 'Power Clean (7x2) (75,80,82.5,85,87,87,90%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000098', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 1, 2, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000099', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 2, 2, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000100', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 3, 2, 0.825, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000101', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 4, 2, 0.85, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000102', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 5, 2, 0.87, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000103', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 6, 2, 0.87, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000104', 'e3000000-0000-4000-8000-202604080001', (select id from public.benchmark_type where name = 'Power Clean'), 7, 2, 0.9, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604080001', 'f3000000-0000-4000-8000-000000000104', (select id from public.benchmark_type where name = 'Power Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Clean' and bd.rep_count = 2), '2026-04-08', 'completed', '285', 285, 2, 0.9, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604080002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '60 Cal Bike, 50 T2B, 40 DB SNatches (50lbs), 30 OHS (95lbs), 20 BMUs', '2026-04-08', 'metcon', 'for_time', 'rx', 2, '60 Cal Bike, 50 T2B, 40 DB SNatches (50lbs), 30 OHS (95lbs), 20 BMUs', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000105', 'e3000000-0000-4000-8000-202604080002', null, 1, '60 Cal Bike, 50 T2B, 40 DB SNatches (50lbs), 30 OHS (95lbs), 20 BMUs', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604080002', 'f3000000-0000-4000-8000-000000000105', null, '2026-04-08', 'completed', '14:44', 884, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604090001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Snatch (5x2) with a 2 sec pause in catch of rep 1 (60,65,65,70,75%)', '2026-04-09', 'weightlifting', 'rx', 1, 'Snatch (5x2) with a 2 sec pause in catch of rep 1 (60,65,65,70,75%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000106', 'e3000000-0000-4000-8000-202604090001', (select id from public.benchmark_type where name = 'Snatch'), 1, 2, 0.6, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000107', 'e3000000-0000-4000-8000-202604090001', (select id from public.benchmark_type where name = 'Snatch'), 2, 2, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000108', 'e3000000-0000-4000-8000-202604090001', (select id from public.benchmark_type where name = 'Snatch'), 3, 2, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000109', 'e3000000-0000-4000-8000-202604090001', (select id from public.benchmark_type where name = 'Snatch'), 4, 2, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000110', 'e3000000-0000-4000-8000-202604090001', (select id from public.benchmark_type where name = 'Snatch'), 5, 2, 0.75, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604090002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 4 x 4 Sets', '2026-04-09', 'metcon', 'amrap', 'rx', 2, 'AMRAP 4 x 4 Sets: 4 DL, 4 Power Cleans, 4 S2OH (95,115,135,155 increasing each set), Rest 1 minute between sets', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000111', 'e3000000-0000-4000-8000-202604090002', null, 1, 'AMRAP 4 x 4 Sets: 4 DL, 4 Power Cleans, 4 S2OH (95,115,135,155 increasing each set), Rest 1 minute between sets', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604100001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3 minutes x 10', '2026-04-10', 'metcon', 'for_time', 'rx', 1, 'Every 3 minutes x 10: 12Cal Bike, 15 Wallballs, 12 T2B', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000112', 'e3000000-0000-4000-8000-202604100001', null, 1, 'Every 3 minutes x 10: 12Cal Bike, 15 Wallballs, 12 T2B', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604100001', 'f3000000-0000-4000-8000-000000000112', null, '2026-04-10', 'completed', '15:56', 956, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604110001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 - For Time', '2026-04-11', 'metcon', 'for_time', 'rx', 1, 'Teams of 2 - For Time: 800m Run together, 100 Cal Ski, 80 Clean & Jerks, 60 BBJOs, 40 C2B, 20 Synchro Wall Walks (1 partner working at a time)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000113', 'e3000000-0000-4000-8000-202604110001', null, 1, 'Teams of 2 - For Time: 800m Run together, 100 Cal Ski, 80 Clean & Jerks, 60 BBJOs, 40 C2B, 20 Synchro Wall Walks (1 partner working at a time)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604110001', 'f3000000-0000-4000-8000-000000000113', null, '2026-04-11', 'completed', '25:30:00', 91800, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604130001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front Squat (5x4) first rep 2 second pause (65,70,75,80,82.5%)', '2026-04-13', 'weightlifting', 'rx', 1, 'Front Squat (5x4) first rep 2 second pause (65,70,75,80,82.5%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000114', 'e3000000-0000-4000-8000-202604130001', (select id from public.benchmark_type where name = 'Front Squat'), 1, 4, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000115', 'e3000000-0000-4000-8000-202604130001', (select id from public.benchmark_type where name = 'Front Squat'), 2, 4, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000116', 'e3000000-0000-4000-8000-202604130001', (select id from public.benchmark_type where name = 'Front Squat'), 3, 4, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000117', 'e3000000-0000-4000-8000-202604130001', (select id from public.benchmark_type where name = 'Front Squat'), 4, 4, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000118', 'e3000000-0000-4000-8000-202604130001', (select id from public.benchmark_type where name = 'Front Squat'), 5, 4, 0.825, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604130001', 'f3000000-0000-4000-8000-000000000118', (select id from public.benchmark_type where name = 'Front Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Front Squat' and bd.rep_count = 4), '2026-04-13', 'completed', '305', 305, 4, 0.825, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604130002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 75'' Front Rack Walking Lunges (2x50), 15 HSPU''s, 18 Cal Echo Bike', '2026-04-13', 'metcon', 'for_time', 'rx', 2, '5 RFT: 75'' Front Rack Walking Lunges (2x50), 15 HSPU''s, 18 Cal Echo Bike', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000119', 'e3000000-0000-4000-8000-202604130002', null, 1, '5 RFT: 75'' Front Rack Walking Lunges (2x50), 15 HSPU''s, 18 Cal Echo Bike', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604130002', 'f3000000-0000-4000-8000-000000000119', null, '2026-04-13', 'completed', '16:44', 1004, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604140001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press (5x4) pause 3 seconds at top (62,67,72,77,80%)', '2026-04-14', 'weightlifting', 'rx', 1, 'Bench Press (5x4) pause 3 seconds at top (62,67,72,77,80%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000120', 'e3000000-0000-4000-8000-202604140001', (select id from public.benchmark_type where name = 'Bench Press'), 1, 4, 0.62, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000121', 'e3000000-0000-4000-8000-202604140001', (select id from public.benchmark_type where name = 'Bench Press'), 2, 4, 0.67, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000122', 'e3000000-0000-4000-8000-202604140001', (select id from public.benchmark_type where name = 'Bench Press'), 3, 4, 0.72, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000123', 'e3000000-0000-4000-8000-202604140001', (select id from public.benchmark_type where name = 'Bench Press'), 4, 4, 0.77, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000124', 'e3000000-0000-4000-8000-202604140001', (select id from public.benchmark_type where name = 'Bench Press'), 5, 4, 0.8, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604140001', 'f3000000-0000-4000-8000-000000000124', (select id from public.benchmark_type where name = 'Bench Press'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Bench Press' and bd.rep_count = 4), '2026-04-14', 'completed', '225', 225, 4, 0.8, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604140002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-04-14', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18: 20 Wall Balls, 15 Pull-ups, 10 Power Snatches', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000125', 'e3000000-0000-4000-8000-202604140002', null, 1, 'AMRAP 18: 20 Wall Balls, 15 Pull-ups, 10 Power Snatches', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604140002', 'f3000000-0000-4000-8000-000000000125', null, '2026-04-14', 'completed', '6 rounds', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604150001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (5x3) 1st two reps TnG (70,70,75,80,85%)', '2026-04-15', 'weightlifting', 'rx', 1, 'Power Clean (5x3) 1st two reps TnG (70,70,75,80,85%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000126', 'e3000000-0000-4000-8000-202604150001', (select id from public.benchmark_type where name = 'Power Clean'), 1, 3, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000127', 'e3000000-0000-4000-8000-202604150001', (select id from public.benchmark_type where name = 'Power Clean'), 2, 3, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000128', 'e3000000-0000-4000-8000-202604150001', (select id from public.benchmark_type where name = 'Power Clean'), 3, 3, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000129', 'e3000000-0000-4000-8000-202604150001', (select id from public.benchmark_type where name = 'Power Clean'), 4, 3, 0.8, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000130', 'e3000000-0000-4000-8000-202604150001', (select id from public.benchmark_type where name = 'Power Clean'), 5, 3, 0.85, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604150001', 'f3000000-0000-4000-8000-000000000130', (select id from public.benchmark_type where name = 'Power Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Clean' and bd.rep_count = 3), '2026-04-15', 'completed', '265', 265, 3, 0.85, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604150002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 4', '2026-04-15', 'metcon', 'for_time', 'rx', 2, 'Every 4:00 x 5 Sets: 400m Run, 15 T2B, 12 Deadlifts', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000131', 'e3000000-0000-4000-8000-202604150002', null, 1, 'Every 4:00 x 5 Sets: 400m Run, 15 T2B, 12 Deadlifts', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604150002', 'f3000000-0000-4000-8000-000000000131', null, '2026-04-15', 'completed', '12:37', 757, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604160001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Snatch (5x3): 1 Snatch, 1 Hang Snatch, 1 Snatch (60,65,70,75,78%)', '2026-04-16', 'weightlifting', 'rx', 1, 'Snatch (5x3): 1 Snatch, 1 Hang Snatch, 1 Snatch (60,65,70,75,78%)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000132', 'e3000000-0000-4000-8000-202604160001', (select id from public.benchmark_type where name = 'Snatch'), 1, 3, 0.6, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000133', 'e3000000-0000-4000-8000-202604160001', (select id from public.benchmark_type where name = 'Snatch'), 2, 3, 0.65, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000134', 'e3000000-0000-4000-8000-202604160001', (select id from public.benchmark_type where name = 'Snatch'), 3, 3, 0.7, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000135', 'e3000000-0000-4000-8000-202604160001', (select id from public.benchmark_type where name = 'Snatch'), 4, 3, 0.75, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000136', 'e3000000-0000-4000-8000-202604160001', (select id from public.benchmark_type where name = 'Snatch'), 5, 3, 0.78, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604160002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-04-16', 'metcon', 'for_time', 'rx', 2, 'For time: 2-4-6-8-10-12-14-16-18: Bar Facing Burpees, Hang Power Cleans (115lbs)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000137', 'e3000000-0000-4000-8000-202604160002', null, 1, 'For time: 2-4-6-8-10-12-14-16-18: Bar Facing Burpees, Hang Power Cleans (115lbs)', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604170001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '3RFT: 800m Run/50Cal Bike/50 Cal Ski (alternating movements each round), 50 Cal ', '2026-04-17', 'metcon', 'for_time', 'rx', 1, '3RFT: 800m Run/50Cal Bike/50 Cal Ski (alternating movements each round), 50 Cal Row, 40 American KB Swings (53lbs), 30 Box Jumps', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000138', 'e3000000-0000-4000-8000-202604170001', null, 1, '3RFT: 800m Run/50Cal Bike/50 Cal Ski (alternating movements each round), 50 Cal Row, 40 American KB Swings (53lbs), 30 Box Jumps', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604170001', 'f3000000-0000-4000-8000-000000000138', null, '2026-04-17', 'completed', '34:02:00', 122520, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604180001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 - 40 min AMRAP', '2026-04-18', 'metcon', 'amrap', 'rx', 1, 'Teams of 2 - 40 min AMRAP: 6 C&Js (185), 8 BJOs, 10 T2B, Every 5 mins both partners run 300m', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000139', 'e3000000-0000-4000-8000-202604180001', null, 1, 'Teams of 2 - 40 min AMRAP: 6 C&Js (185), 8 BJOs, 10 T2B, Every 5 mins both partners run 300m', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604200001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat (5x5) 62,67,72,77,80% rest 2-3mins between sets', '2026-04-20', 'weightlifting', 'rx', 1, 'Back Squat (5x5) 62,67,72,77,80% rest 2-3mins between sets', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000140', 'e3000000-0000-4000-8000-202604200001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000141', 'e3000000-0000-4000-8000-202604200001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000142', 'e3000000-0000-4000-8000-202604200001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000143', 'e3000000-0000-4000-8000-202604200001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000144', 'e3000000-0000-4000-8000-202604200001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 5, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604200001', 'f3000000-0000-4000-8000-000000000144', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 5), '2026-04-20', 'completed', '345', 345, 5, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604200002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 4 mins x 5 sets', '2026-04-20', 'metcon', 'for_time', 'rx', 2, 'Every 4 mins x 5 sets: 400m Run, 12 Toes to bar, 10 power cleans (135)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000145', 'e3000000-0000-4000-8000-202604200002', null, 1, 'Every 4 mins x 5 sets: 400m Run, 12 Toes to bar, 10 power cleans (135)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604200002', 'f3000000-0000-4000-8000-000000000145', null, '2026-04-20', 'completed', '12:56', 776, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604210001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Push Jerk: (5x5), 62,67,72,77,80%', '2026-04-21', 'weightlifting', 'rx', 1, 'Push Jerk: (5x5), 62,67,72,77,80%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000146', 'e3000000-0000-4000-8000-202604210001', (select id from public.benchmark_type where name = 'Push Jerk'), 1, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000147', 'e3000000-0000-4000-8000-202604210001', (select id from public.benchmark_type where name = 'Push Jerk'), 2, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000148', 'e3000000-0000-4000-8000-202604210001', (select id from public.benchmark_type where name = 'Push Jerk'), 3, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000149', 'e3000000-0000-4000-8000-202604210001', (select id from public.benchmark_type where name = 'Push Jerk'), 4, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000150', 'e3000000-0000-4000-8000-202604210001', (select id from public.benchmark_type where name = 'Push Jerk'), 5, 5, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604210001', 'f3000000-0000-4000-8000-000000000150', (select id from public.benchmark_type where name = 'Push Jerk'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Push Jerk' and bd.rep_count = 5), '2026-04-21', 'completed', '260', 260, 5, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604210002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 2', '2026-04-21', 'metcon', 'for_time', 'rx', 2, 'Every 2:15 x 10 rounds', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000151', 'e3000000-0000-4000-8000-202604210002', null, 1, 'Every 2:15 x 10 rounds', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604210002', 'f3000000-0000-4000-8000-000000000151', null, '2026-04-21', 'completed', '15 Cal row, 15 wallballs (20lbs)', null, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604220001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Hang Power Clean (6x3) 60,65,70,75,80,82%', '2026-04-22', 'weightlifting', 'rx', 1, 'Hang Power Clean (6x3) 60,65,70,75,80,82%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000152', 'e3000000-0000-4000-8000-202604220001', (select id from public.benchmark_type where name = 'Hang Power Clean'), 1, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000153', 'e3000000-0000-4000-8000-202604220001', (select id from public.benchmark_type where name = 'Hang Power Clean'), 2, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000154', 'e3000000-0000-4000-8000-202604220001', (select id from public.benchmark_type where name = 'Hang Power Clean'), 3, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000155', 'e3000000-0000-4000-8000-202604220001', (select id from public.benchmark_type where name = 'Hang Power Clean'), 4, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000156', 'e3000000-0000-4000-8000-202604220001', (select id from public.benchmark_type where name = 'Hang Power Clean'), 5, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000157', 'e3000000-0000-4000-8000-202604220001', (select id from public.benchmark_type where name = 'Hang Power Clean'), 6, 3, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604220001', 'f3000000-0000-4000-8000-000000000157', (select id from public.benchmark_type where name = 'Hang Power Clean'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Hang Power Clean' and bd.rep_count = 3), '2026-04-22', 'completed', '255', 255, 3, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604220002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30-25-20-15-10-5 Pull-ups, Alt DB Snatches (50), 12 cal bike after each round', '2026-04-22', 'metcon', 'for_time', 'rx', 2, '30-25-20-15-10-5 Pull-ups, Alt DB Snatches (50), 12 cal bike after each round', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000158', 'e3000000-0000-4000-8000-202604220002', null, 1, '30-25-20-15-10-5 Pull-ups, Alt DB Snatches (50), 12 cal bike after each round', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604220002', 'f3000000-0000-4000-8000-000000000158', null, '2026-04-22', 'completed', '12:49', 769, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604230001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift (5x3): 65,70,75,80,85%', '2026-04-23', 'weightlifting', 'rx', 1, 'Deadlift (5x3): 65,70,75,80,85%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000159', 'e3000000-0000-4000-8000-202604230001', (select id from public.benchmark_type where name = 'Deadlift'), 1, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000160', 'e3000000-0000-4000-8000-202604230001', (select id from public.benchmark_type where name = 'Deadlift'), 2, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000161', 'e3000000-0000-4000-8000-202604230001', (select id from public.benchmark_type where name = 'Deadlift'), 3, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000162', 'e3000000-0000-4000-8000-202604230001', (select id from public.benchmark_type where name = 'Deadlift'), 4, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000163', 'e3000000-0000-4000-8000-202604230001', (select id from public.benchmark_type where name = 'Deadlift'), 5, 3, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604230001', 'f3000000-0000-4000-8000-000000000163', (select id from public.benchmark_type where name = 'Deadlift'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Deadlift' and bd.rep_count = 3), '2026-04-23', 'completed', '435', 435, 3, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604230002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-04-23', 'metcon', 'for_time', 'rx', 2, 'Every 3:00 x 7 sets: 10 front squats (155), 10 HSPU, 15 cal ski', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000164', 'e3000000-0000-4000-8000-202604230002', null, 1, 'Every 3:00 x 7 sets: 10 front squats (155), 10 HSPU, 15 cal ski', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604240001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-04-24', 'metcon', 'amrap', 'rx', 1, 'For time: 9 squat snatches (155), 15 thrusters (155), 21 clean & jerks (155), rest 3:00, AMRAP 10:00, 100m run, 25'' HSW, rest 2:00, 3 rounds, 125 double unders, 100m Farmers Carry (70)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000165', 'e3000000-0000-4000-8000-202604240001', null, 1, 'For time: 9 squat snatches (155), 15 thrusters (155), 21 clean & jerks (155), rest 3:00, AMRAP 10:00, 100m run, 25'' HSW, rest 2:00, 3 rounds, 125 double unders, 100m Farmers Carry (70)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604240001', 'f3000000-0000-4000-8000-000000000165', null, '2026-04-24', 'completed', '22:25', 1345, 'scaled', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604270001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat (5x4) 70,74,78,82,85%', '2026-04-27', 'weightlifting', 'rx', 1, 'Back Squat (5x4) 70,74,78,82,85%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000166', 'e3000000-0000-4000-8000-202604270001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000167', 'e3000000-0000-4000-8000-202604270001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000168', 'e3000000-0000-4000-8000-202604270001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000169', 'e3000000-0000-4000-8000-202604270001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000170', 'e3000000-0000-4000-8000-202604270001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 4, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604270001', 'f3000000-0000-4000-8000-000000000170', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 4), '2026-04-27', 'completed', '365', 365, 4, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604270002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-04-27', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18:00: 1.2.3.4.5.6. etc wall walks, 15 Box Jump Overs 24, 18 cal row', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000171', 'e3000000-0000-4000-8000-202604270002', null, 1, 'AMRAP 18:00: 1.2.3.4.5.6. etc wall walks, 15 Box Jump Overs 24, 18 cal row', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604270002', 'f3000000-0000-4000-8000-000000000171', null, '2026-04-27', 'completed', '7 + 3', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604280001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Snatch (5x5): 65,70,70,75,75%', '2026-04-28', 'weightlifting', 'rx', 1, 'Power Snatch (5x5): 65,70,70,75,75%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000172', 'e3000000-0000-4000-8000-202604280001', (select id from public.benchmark_type where name = 'Power Snatch'), 1, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000173', 'e3000000-0000-4000-8000-202604280001', (select id from public.benchmark_type where name = 'Power Snatch'), 2, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000174', 'e3000000-0000-4000-8000-202604280001', (select id from public.benchmark_type where name = 'Power Snatch'), 3, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000175', 'e3000000-0000-4000-8000-202604280001', (select id from public.benchmark_type where name = 'Power Snatch'), 4, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000176', 'e3000000-0000-4000-8000-202604280001', (select id from public.benchmark_type where name = 'Power Snatch'), 5, 5, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604280001', 'f3000000-0000-4000-8000-000000000176', (select id from public.benchmark_type where name = 'Power Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Snatch' and bd.rep_count = 5), '2026-04-28', 'completed', '185', 185, 5, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604280002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 400m run, 12 dealdifts, 15 C2B', '2026-04-28', 'metcon', 'for_time', 'rx', 2, '5 RFT: 400m run, 12 dealdifts, 15 C2B', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000177', 'e3000000-0000-4000-8000-202604280002', null, 1, '5 RFT: 400m run, 12 dealdifts, 15 C2B', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604280002', 'f3000000-0000-4000-8000-000000000177', null, '2026-04-28', 'completed', '15:44', 944, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604290001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Complex (1 Power Clean + 1 Hang Clean): 70,75,80,82,85%', '2026-04-29', 'weightlifting', 'rx', 1, 'Complex (1 Power Clean + 1 Hang Clean): 70,75,80,82,85%', 'gym');
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000178', 'e3000000-0000-4000-8000-202604290001', 1, 'Complex (1 Power Clean + 1 Hang Clean): 70,75,80,82,85%', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604290001', 'f3000000-0000-4000-8000-000000000178', null, null, '2026-04-29', 'completed', '275', 275, null, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604290002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-04-29', 'metcon', 'for_time', 'rx', 2, 'Every 3:30 x 5 sets: 15 cal bike, 15 T2B, 9 Front Squats', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000179', 'e3000000-0000-4000-8000-202604290002', null, 1, 'Every 3:30 x 5 sets: 15 cal bike, 15 T2B, 9 Front Squats', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604300001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift (5x3): 72,77,82,85,88%', '2026-04-30', 'weightlifting', 'rx', 1, 'Deadlift (5x3): 72,77,82,85,88%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000180', 'e3000000-0000-4000-8000-202604300001', (select id from public.benchmark_type where name = 'Deadlift'), 1, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000181', 'e3000000-0000-4000-8000-202604300001', (select id from public.benchmark_type where name = 'Deadlift'), 2, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000182', 'e3000000-0000-4000-8000-202604300001', (select id from public.benchmark_type where name = 'Deadlift'), 3, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000183', 'e3000000-0000-4000-8000-202604300001', (select id from public.benchmark_type where name = 'Deadlift'), 4, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000184', 'e3000000-0000-4000-8000-202604300001', (select id from public.benchmark_type where name = 'Deadlift'), 5, 3, null, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604300002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-04-30', 'metcon', 'emom', 'rx', 2, 'EMOM 20:
Min 1 - 15 cal ski
min 2 - 30'' HSW
Min 3 - 20 Wallballs
Min 4 - 100'' Dbl KB FR carry 70s', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000185', 'e3000000-0000-4000-8000-202604300002', null, 1, 'EMOM 20:
Min 1 - 15 cal ski
min 2 - 30'' HSW
Min 3 - 20 Wallballs
Min 4 - 100'' Dbl KB FR carry 70s', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605010001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time ', '2026-05-01', 'metcon', 'for_time', 'rx', 1, 'For time : 1000m row, 50 thrusters (95), 800m run, 40 pull-ups, 600m run, 30 clean & jerks (135), 400m run, 20 BMU''s', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000186', 'e3000000-0000-4000-8000-202605010001', null, 1, 'For time : 1000m row, 50 thrusters (95), 800m run, 40 pull-ups, 600m run, 30 clean & jerks (135), 400m run, 20 BMU''s', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605010001', 'f3000000-0000-4000-8000-000000000186', null, '2026-05-01', 'completed', '29:11:00', 105060, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605020001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 3', '2026-05-02', 'metcon', 'for_time', 'rx', 1, 'Teams of 3: 5 Rounds: 4:00 Work / 2:00 Rest: 200m run together, 12 synchro front squats (135), 12 synchro bar facing burpees, max cal on bike in remaining time', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000187', 'e3000000-0000-4000-8000-202605020001', null, 1, 'Teams of 3: 5 Rounds: 4:00 Work / 2:00 Rest: 200m run together, 12 synchro front squats (135), 12 synchro bar facing burpees, max cal on bike in remaining time', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605020001', 'f3000000-0000-4000-8000-000000000187', null, '2026-05-02', 'completed', '196', null, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605040001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Snatch Complex: Hang Power Snatch + power Snatch + OHS (6 sets): 60,65,70,70,75,75&', '2026-05-04', 'weightlifting', 'rx', 1, 'Power Snatch Complex: Hang Power Snatch + power Snatch + OHS (6 sets): 60,65,70,70,75,75&', 'gym');
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000188', 'e3000000-0000-4000-8000-202605040001', 1, 'Power Snatch Complex: Hang Power Snatch + power Snatch + OHS (6 sets): 60,65,70,70,75,75&', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605040001', 'f3000000-0000-4000-8000-000000000188', (select id from public.benchmark_type where name = 'Power Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Power Snatch' and bd.rep_count = 1), '2026-05-04', 'completed', '205', 205, null, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605040002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-05-04', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18:00: 10 Wall Balls, 12 Pull-ups, 14 Cal Row', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000189', 'e3000000-0000-4000-8000-202605040002', null, 1, 'AMRAP 18:00: 10 Wall Balls, 12 Pull-ups, 14 Cal Row', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605040002', 'f3000000-0000-4000-8000-000000000189', null, '2026-05-04', 'completed', '9+9', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605050001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Push Jerk (5x5): 65,65,70,75,75%', '2026-05-05', 'weightlifting', 'rx', 1, 'Push Jerk (5x5): 65,65,70,75,75%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000190', 'e3000000-0000-4000-8000-202605050001', (select id from public.benchmark_type where name = 'Push Jerk'), 1, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000191', 'e3000000-0000-4000-8000-202605050001', (select id from public.benchmark_type where name = 'Push Jerk'), 2, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000192', 'e3000000-0000-4000-8000-202605050001', (select id from public.benchmark_type where name = 'Push Jerk'), 3, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000193', 'e3000000-0000-4000-8000-202605050001', (select id from public.benchmark_type where name = 'Push Jerk'), 4, 5, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000194', 'e3000000-0000-4000-8000-202605050001', (select id from public.benchmark_type where name = 'Push Jerk'), 5, 5, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605050001', 'f3000000-0000-4000-8000-000000000194', (select id from public.benchmark_type where name = 'Push Jerk'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Push Jerk' and bd.rep_count = 5), '2026-05-05', 'completed', '245', 245, 5, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605050002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Crossfit De Mayo', '2026-05-05', 'metcon', 'for_time', 'rx', 2, 'Crossfit De Mayo: Eveery 4:00 x 5 sets: 400m run, 14 Deadlifts (205), 10 GHD''s', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000195', 'e3000000-0000-4000-8000-202605050002', null, 1, 'Crossfit De Mayo: Eveery 4:00 x 5 sets: 400m run, 14 Deadlifts (205), 10 GHD''s', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605050002', 'f3000000-0000-4000-8000-000000000195', null, '2026-05-05', 'completed', '14:57', 897, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605060001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front squat (4x4): 70,74,78,82%', '2026-05-06', 'weightlifting', 'rx', 1, 'Front squat (4x4): 70,74,78,82%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000196', 'e3000000-0000-4000-8000-202605060001', (select id from public.benchmark_type where name = 'Front Squat'), 1, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000197', 'e3000000-0000-4000-8000-202605060001', (select id from public.benchmark_type where name = 'Front Squat'), 2, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000198', 'e3000000-0000-4000-8000-202605060001', (select id from public.benchmark_type where name = 'Front Squat'), 3, 4, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000199', 'e3000000-0000-4000-8000-202605060001', (select id from public.benchmark_type where name = 'Front Squat'), 4, 4, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605060001', 'f3000000-0000-4000-8000-000000000199', (select id from public.benchmark_type where name = 'Front Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Front Squat' and bd.rep_count = 4), '2026-05-06', 'completed', '315', 315, 4, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605060002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 15 cal bike, 12 power cleans, 12 HSPU', '2026-05-06', 'metcon', 'for_time', 'rx', 2, '5 RFT: 15 cal bike, 12 power cleans, 12 HSPU', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000200', 'e3000000-0000-4000-8000-202605060002', null, 1, '5 RFT: 15 cal bike, 12 power cleans, 12 HSPU', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605060002', 'f3000000-0000-4000-8000-000000000200', null, '2026-05-06', 'completed', '12:41', 761, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605070001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift (5x3): 72,77,82,85,88%', '2026-05-07', 'weightlifting', 'rx', 1, 'Deadlift (5x3): 72,77,82,85,88%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000201', 'e3000000-0000-4000-8000-202605070001', (select id from public.benchmark_type where name = 'Deadlift'), 1, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000202', 'e3000000-0000-4000-8000-202605070001', (select id from public.benchmark_type where name = 'Deadlift'), 2, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000203', 'e3000000-0000-4000-8000-202605070001', (select id from public.benchmark_type where name = 'Deadlift'), 3, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000204', 'e3000000-0000-4000-8000-202605070001', (select id from public.benchmark_type where name = 'Deadlift'), 4, 3, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000205', 'e3000000-0000-4000-8000-202605070001', (select id from public.benchmark_type where name = 'Deadlift'), 5, 3, null, 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605070002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-05-07', 'metcon', 'emom', 'rx', 2, 'EMOM 20:
Min 1 - 15 cal ski
min 2 - 15 box jump overs 24
Min 3 - 12 front squats (135)
Min 4 - :40 DBL DB OH carry 50s', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000206', 'e3000000-0000-4000-8000-202605070002', null, 1, 'EMOM 20:
Min 1 - 15 cal ski
min 2 - 15 box jump overs 24
Min 3 - 12 front squats (135)
Min 4 - :40 DBL DB OH carry 50s', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605080001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-05-08', 'metcon', 'for_time', 'rx', 1, 'For time: 15 squat snatches 9135), 15 BMUs, 30 Cal Bike, Rest 3:00, then: 3 rounds: 200m run, 15 wall balls, 10 burpee pull-ups, rest 2:00, then: 3 rounds: 100 double unders, 100'' farmers carry 70s', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000207', 'e3000000-0000-4000-8000-202605080001', null, 1, 'For time: 15 squat snatches 9135), 15 BMUs, 30 Cal Bike, Rest 3:00, then: 3 rounds: 200m run, 15 wall balls, 10 burpee pull-ups, rest 2:00, then: 3 rounds: 100 double unders, 100'' farmers carry 70s', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605080001', 'f3000000-0000-4000-8000-000000000207', null, '2026-05-08', 'completed', '18:52', 1132, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605090001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2, 1 partner working at a time', '2026-05-09', 'metcon', 'for_time', 'rx', 1, 'Teams of 2, 1 partner working at a time:
1500m row, 120 Power snatches (95), 100 T2B, 80 hang power clean and jerks, 600m run together, 50 BBJOs 24, spliit reps however desired', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000208', 'e3000000-0000-4000-8000-202605090001', null, 1, 'Teams of 2, 1 partner working at a time:
1500m row, 120 Power snatches (95), 100 T2B, 80 hang power clean and jerks, 600m run together, 50 BBJOs 24, spliit reps however desired', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605090001', 'f3000000-0000-4000-8000-000000000208', null, '2026-05-09', 'completed', '26:46:00', 96360, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605110001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Snatch (6x2) 65,65,70,70,75,75%', '2026-05-11', 'weightlifting', 'rx', 1, 'Snatch (6x2) 65,65,70,70,75,75%', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000209', 'e3000000-0000-4000-8000-202605110001', (select id from public.benchmark_type where name = 'Snatch'), 1, 2, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000210', 'e3000000-0000-4000-8000-202605110001', (select id from public.benchmark_type where name = 'Snatch'), 2, 2, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000211', 'e3000000-0000-4000-8000-202605110001', (select id from public.benchmark_type where name = 'Snatch'), 3, 2, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000212', 'e3000000-0000-4000-8000-202605110001', (select id from public.benchmark_type where name = 'Snatch'), 4, 2, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000213', 'e3000000-0000-4000-8000-202605110001', (select id from public.benchmark_type where name = 'Snatch'), 5, 2, null, 'pending');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('f3000000-0000-4000-8000-000000000214', 'e3000000-0000-4000-8000-202605110001', (select id from public.benchmark_type where name = 'Snatch'), 6, 2, null, 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605110001', 'f3000000-0000-4000-8000-000000000214', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), '2026-05-11', 'completed', '215', 215, 2, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605110002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-05-11', 'metcon', 'for_time', 'rx', 2, 'Every 3:30 x 5 sets: 18 cal row, 5 BMU/RMU alternating sets, 10 OHS (115)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000215', 'e3000000-0000-4000-8000-202605110002', null, 1, 'Every 3:30 x 5 sets: 18 cal row, 5 BMU/RMU alternating sets, 10 OHS (115)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605110002', 'f3000000-0000-4000-8000-000000000215', null, '2026-05-11', 'completed', '10:16', 616, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605120001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 Complexes: Clean + Hang Clean + Front Squat, 65,65,70,70,75%', '2026-05-12', 'weightlifting', 'rx', 1, '5 Complexes: Clean + Hang Clean + Front Squat, 65,65,70,70,75%', 'gym');
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000216', 'e3000000-0000-4000-8000-202605120001', 1, '5 Complexes: Clean + Hang Clean + Front Squat, 65,65,70,70,75%', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605120001', 'f3000000-0000-4000-8000-000000000216', null, null, '2026-05-12', 'completed', '295', 295, null, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605120002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-05-12', 'metcon', 'for_time', 'rx', 2, 'For time: 75 cal bike, 60 bar-facing burpees, 50 front squats (135), 35 box jumps', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000217', 'e3000000-0000-4000-8000-202605120002', null, 1, 'For time: 75 cal bike, 60 bar-facing burpees, 50 front squats (135), 35 box jumps', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605120002', 'f3000000-0000-4000-8000-000000000217', null, '2026-05-12', 'completed', '16:00', 960, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605130001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4 sets: 30 alt hammer curls, 20 OH DB tricep extensions', '2026-05-13', 'weightlifting', 'rx', 1, '4 sets: 30 alt hammer curls, 20 OH DB tricep extensions', 'gym');
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000218', 'e3000000-0000-4000-8000-202605130001', 1, '4 sets: 30 alt hammer curls, 20 OH DB tricep extensions', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605130001', 'f3000000-0000-4000-8000-000000000218', null, null, '2026-05-13', 'completed', 'Completed', null, null, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605130002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 20', '2026-05-13', 'metcon', 'amrap', 'rx', 2, 'AMRAP 20: 30 Air Squats, Row 20 Cals, 100m Farmers Carry (70s)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000219', 'e3000000-0000-4000-8000-202605130002', null, 1, 'AMRAP 20: 30 Air Squats, Row 20 Cals, 100m Farmers Carry (70s)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605130002', 'f3000000-0000-4000-8000-000000000219', null, '2026-05-13', 'completed', '4+37', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605140001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Flight simulator: 5-10-15-20-25-30-35-40-45-50-45-40-35-30-25-20-15-10-5 unbroken dubs each set', '2026-05-14', 'weightlifting', 'rx', 1, 'Flight simulator: 5-10-15-20-25-30-35-40-45-50-45-40-35-30-25-20-15-10-5 unbroken dubs each set', 'gym');
insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000220', 'e3000000-0000-4000-8000-202605140001', 1, 'Flight simulator: 5-10-15-20-25-30-35-40-45-50-45-40-35-30-25-20-15-10-5 unbroken dubs each set', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605140002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 400m Run, 12 hang power cleans (135), 25 ab mat situps', '2026-05-14', 'metcon', 'for_time', 'rx', 2, '5 RFT: 400m Run, 12 hang power cleans (135), 25 ab mat situps', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000221', 'e3000000-0000-4000-8000-202605140002', null, 1, '5 RFT: 400m Run, 12 hang power cleans (135), 25 ab mat situps', 'pending');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605150001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-05-15', 'metcon', 'amrap', 'rx', 1, 'For time: 20 power snatches, 25 chest to bar pull-ups, 30 cal row, rest 3:00, then AMRAP 10: 200m run, 20 wall balls 5 freehandstanding pushups (amrap is one score), rest 2:00, then 3 rounds 50'' HSW, 3 Rope Climbs (other score is total time)', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000222', 'e3000000-0000-4000-8000-202605150001', null, 1, 'For time: 20 power snatches, 25 chest to bar pull-ups, 30 cal row, rest 3:00, then AMRAP 10: 200m run, 20 wall balls 5 freehandstanding pushups (amrap is one score), rest 2:00, then 3 rounds 50'' HSW, 3 Rope Climbs (other score is total time)', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605150001', 'f3000000-0000-4000-8000-000000000222', null, '2026-05-15', 'completed', '25:56, 3 rounds', null, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605160001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2, For Time', '2026-05-16', 'metcon', 'for_time', 'rx', 1, 'Teams of 2, For Time: 1000m run together, then split and partition, 100 hang power cleans (115), 100 box jump overs 24, 100 shoulder to overhead (115), 100 T2B, finish with 8 miniute row, alt 1 minute off for max calories (two scores', 'gym');
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('f3000000-0000-4000-8000-000000000223', 'e3000000-0000-4000-8000-202605160001', null, 1, 'Teams of 2, For Time: 1000m run together, then split and partition, 100 hang power cleans (115), 100 box jump overs 24, 100 shoulder to overhead (115), 100 T2B, finish with 8 miniute row, alt 1 minute off for max calories (two scores', 'pending');
insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605160001', 'f3000000-0000-4000-8000-000000000223', null, '2026-05-16', 'completed', '17:53, 169 row calories', null, 'rx', false);

alter table public.programming enable trigger programming_update_guard;
alter table public.programming_line_item enable trigger pli_update_guard;