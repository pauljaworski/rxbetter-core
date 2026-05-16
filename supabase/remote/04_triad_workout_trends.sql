-- Triad Workout Trends: 3-16--tbd Cycle (Triad Workout Trends (1).xlsx)
alter table public.programming disable trigger programming_update_guard;
alter table public.programming_line_item disable trigger pli_update_guard;

delete from public.athlete_performance where programming_id in (
  select id from public.programming where gym_id = 'a0000000-0000-4000-8000-000000000001' and wod_date >= '2026-03-16' and wod_date <= '2026-06-30'
);
delete from public.programming_line_item where programming_id in (
  select id from public.programming where gym_id = 'a0000000-0000-4000-8000-000000000001' and wod_date >= '2026-03-16' and wod_date <= '2026-06-30'
);
delete from public.programming where gym_id = 'a0000000-0000-4000-8000-000000000001' and wod_date >= '2026-03-16' and wod_date <= '2026-06-30';

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603160001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x5 (65,70,75,75,75%)', '2026-03-16', 'weightlifting', 'rx', 1, 'Back Squat 5x5 (65,70,75,75,75%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603160001', '2026-03-16', 'completed', '215', 215, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603160002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4RFT: 400m Run, 21 Wall Balls, 15 Pull-ups, 9 DL (185lbs)', '2026-03-16', 'metcon', 'for_time', 'rx', 2, '4RFT: 400m Run, 21 Wall Balls, 15 Pull-ups, 9 DL (185lbs)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603160002', '2026-03-16', 'completed', '16:48', 1008, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603170001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press 5x4 (65,70,75,75,80%)', '2026-03-17', 'weightlifting', 'rx', 1, 'Bench Press 5x4 (65,70,75,75,80%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603170002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3 minutes for 6 sets', '2026-03-17', 'metcon', 'for_time', 'rx', 2, 'Every 3 minutes for 6 sets: 15 Cal Bike, 12 T2B, 9 Push Press (135lbs)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603180001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (6x2) TnG (75-85%)', '2026-03-18', 'weightlifting', 'rx', 1, 'Power Clean (6x2) TnG (75-85%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603180001', '2026-03-18', 'completed', '225', 225, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603180002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '21-15-9', '2026-03-18', 'metcon', 'for_time', 'rx', 2, '21-15-9: Burpees over Bar, Front Squat (135 lbs), Cal Ski', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603180002', '2026-03-18', 'completed', '7:59', 479, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603190001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift 6x3 (60,65,70,75,80,85%)', '2026-03-19', 'weightlifting', 'rx', 1, 'Deadlift 6x3 (60,65,70,75,80,85%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603190002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-03-19', 'metcon', 'emom', 'rx', 2, 'EMOM 20: 1: 14 Cal Row, 2: 16 ALt DB Snatch (50 lbs), 3: 8 BBJO''s (24), 4: 12 HSPU', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603200001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For Time', '2026-03-20', 'metcon', 'for_time', 'rx', 1, 'For Time: 800m Run, 60 KB Swings (53lbs), 50 Sit-ups, 40 Dbl DB Walking Lunges (50s), 40 Cal Bike, 30 Thursters (95lbs), 20 DB Box Step Overs (24, 50s), 10 BMU, 40 Cal Row', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603210001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 40 (Temas of 2,1 works, 1 rests)', '2026-03-21', 'metcon', 'amrap', 'rx', 1, 'AMRAP 40 (Temas of 2,1 works, 1 rests): 1500m Row, 120 Wall Balls, 90 DB Hang Snatches (50lbs), 60 BBJO''s, 30 Burpee Pull-ups', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603210001', '2026-03-21', 'completed', '2+1200 Rx', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603230001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x5 (60,65,70,75,78%)', '2026-03-23', 'weightlifting', 'rx', 1, 'Back Squat 5x5 (60,65,70,75,78%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603230001', '2026-03-23', 'completed', '335', 335, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603230002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-03-23', 'metcon', 'for_time', 'rx', 2, 'Every 3:30 x 5 sets: 15 Cal Row, 13 T2B, 11 Hang Power Cleans (135lbs)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603230002', '2026-03-23', 'completed', '7:52', 472, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603240001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press 5x4 (65,70,75,77.5,80%)', '2026-03-24', 'weightlifting', 'rx', 1, 'Bench Press 5x4 (65,70,75,77.5,80%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603240001', '2026-03-24', 'completed', '225', 225, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603240002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4 RFT: 400m Run, 15 KB Swings (70lbs), 12 BBJO, 9 Cal Ski', '2026-03-24', 'metcon', 'for_time', 'rx', 2, '4 RFT: 400m Run, 15 KB Swings (70lbs), 12 BBJO, 9 Cal Ski', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603240002', '2026-03-24', 'completed', '19:00', 1140, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603250001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (7x2) (70,70,75,80,80,82.5,85%)', '2026-03-25', 'weightlifting', 'rx', 1, 'Power Clean (7x2) (70,70,75,80,80,82.5,85%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603250002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-03-25', 'metcon', 'emom', 'rx', 2, 'EMOM 20: 1: 0:40 Cal Row, 2: 10 S2OH, 3: 15 Pull-ups, 4: 50'' HSW', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603260001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front Squat with a 2 second pause on rep 1 (5x2) (70,75,80,82.5,85%)', '2026-03-26', 'weightlifting', 'rx', 1, 'Front Squat with a 2 second pause on rep 1 (5x2) (70,75,80,82.5,85%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603260002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2RFT: 70 Double Unders, 50 Sit-ups, 30 Box Jump Overs, 20 Alt DB Hang Squat Clea', '2026-03-26', 'metcon', 'for_time', 'rx', 2, '2RFT: 70 Double Unders, 50 Sit-ups, 30 Box Jump Overs, 20 Alt DB Hang Squat Clean Thrusters (50lbs)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603270001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 15 Cal Bike, 20 Wallballs, 15 Cal Ski, 20 DB Front Rack Walking Lunges (5', '2026-03-27', 'metcon', 'for_time', 'rx', 1, '5 RFT: 15 Cal Bike, 20 Wallballs, 15 Cal Ski, 20 DB Front Rack Walking Lunges (50s), 15 Cal Row', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603280001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 For Time', '2026-03-28', 'metcon', 'for_time', 'rx', 1, 'Teams of 2 For Time: 200 Cal Echo BIke. 160 Hang Power Cleans (115lbs), 120 Bar Facing Burpees, 80 HSPU, 40 BMU', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603300001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x5 (62,67,72,77,80%)', '2026-03-30', 'weightlifting', 'rx', 1, 'Back Squat 5x5 (62,67,72,77,80%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603300002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Everty 3', '2026-03-30', 'metcon', 'for_time', 'rx', 2, 'Everty 3:30 x 5 Sets: 20 Cal Bike, 10 C2B, 10 OHS (95lbs)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603310001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press 5x4 (67,72,77,80,82.5%)', '2026-03-31', 'weightlifting', 'rx', 1, 'Bench Press 5x4 (67,72,77,80,82.5%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603310001', '2026-03-31', 'completed', '235', 235, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202603310002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4 RFT: 400m RUN, 20 Wallballs, 16 Alt DB Hang Snatches (50lbs), 10 Burpee Box Ju', '2026-03-31', 'metcon', 'for_time', 'rx', 2, '4 RFT: 400m RUN, 20 Wallballs, 16 Alt DB Hang Snatches (50lbs), 10 Burpee Box Jump Overs', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202603310002', '2026-03-31', 'completed', '21:19', 1279, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604010001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (7x2) (75,75,80,82.5,85,87%)', '2026-04-01', 'weightlifting', 'rx', 1, 'Power Clean (7x2) (75,75,80,82.5,85,87%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604010001', '2026-04-01', 'completed', '275', 275, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604010002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 10 minutes x 2', '2026-04-01', 'metcon', 'for_time', 'rx', 2, 'Every 10 minutes x 2: 100 Double Unders, 40 Cal SKI, 20 Devils Press (2x50lbs), 10 Box Get Overs 40', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604010002', '2026-04-01', 'completed', '15:21', 921, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604020001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front Squat with a 2 second pause on rep 1 (5x2) (72,77,82,85,87%)', '2026-04-02', 'weightlifting', 'rx', 1, 'Front Squat with a 2 second pause on rep 1 (5x2) (72,77,82,85,87%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604020001', '2026-04-02', 'completed', '325', 325, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604020002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-04-02', 'metcon', 'emom', 'rx', 2, 'EMOM 20: 1: 0:40 Cal Row, 2: 8 Clean & Jerks (135lbs), 3: 0:40 Max T2B, 4: 50'' HSW', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604020002', '2026-04-02', 'completed', '153 reps', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604030001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For Time', '2026-04-03', 'metcon', 'for_time', 'rx', 1, 'For Time: 1600m Run, 80 Wallballs, 60 T2B, 100'' Double DB Front Rack Walking Lunges (2x50)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604030001', '2026-04-03', 'completed', '16:23', 983, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604040001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 - Interval Chipper', '2026-04-04', 'metcon', 'for_time', 'rx', 1, 'Teams of 2 - Interval Chipper: 4 RoundsL 400m Run Together, 30 Hang Power Cleans (115lbs, 30 Bar Facing Burpees, Max Cal Echo Bike, Rest 1 min', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604040001', '2026-04-04', 'completed', '235 calories', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604060001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat 5x4 (65,70,75,8082.5,82.5%)', '2026-04-06', 'weightlifting', 'rx', 1, 'Back Squat 5x4 (65,70,75,8082.5,82.5%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604060001', '2026-04-06', 'completed', '350', 350, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604060002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-04-06', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18: 15 Cal Ski, 13 Front Squats (115lbs), 11 S2OH, 9 C2B', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604070001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Push Press (6x3) (70,75,80,82.5,85,85%)', '2026-04-07', 'weightlifting', 'rx', 1, 'Push Press (6x3) (70,75,80,82.5,85,85%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604070001', '2026-04-07', 'completed', '255', 255, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604070002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5RFT: 300m Run, 20 Wallballs, 10 HSPU', '2026-04-07', 'metcon', 'for_time', 'rx', 2, '5RFT: 300m Run, 20 Wallballs, 10 HSPU', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604070002', '2026-04-07', 'completed', '14:43', 883, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604080001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (7x2) (75,80,82.5,85,87,87,90%)', '2026-04-08', 'weightlifting', 'rx', 1, 'Power Clean (7x2) (75,80,82.5,85,87,87,90%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604080001', '2026-04-08', 'completed', '285', 285, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604080002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '60 Cal Bike, 50 T2B, 40 DB SNatches (50lbs), 30 OHS (95lbs), 20 BMUs', '2026-04-08', 'metcon', 'for_time', 'rx', 2, '60 Cal Bike, 50 T2B, 40 DB SNatches (50lbs), 30 OHS (95lbs), 20 BMUs', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604080002', '2026-04-08', 'completed', '14:44', 884, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604090001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Snatch (5x2) with a 2 sec pause in catch of rep 1 (60,65,65,70,75%)', '2026-04-09', 'weightlifting', 'rx', 1, 'Snatch (5x2) with a 2 sec pause in catch of rep 1 (60,65,65,70,75%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604090002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 4 x 4 Sets', '2026-04-09', 'metcon', 'amrap', 'rx', 2, 'AMRAP 4 x 4 Sets: 4 DL, 4 Power Cleans, 4 S2OH (95,115,135,155 increasing each set), Rest 1 minute between sets', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604100001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3 minutes x 10', '2026-04-10', 'metcon', 'for_time', 'rx', 1, 'Every 3 minutes x 10: 12Cal Bike, 15 Wallballs, 12 T2B', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604100001', '2026-04-10', 'completed', '15:56', 956, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604110001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 - For Time', '2026-04-11', 'metcon', 'for_time', 'rx', 1, 'Teams of 2 - For Time: 800m Run together, 100 Cal Ski, 80 Clean & Jerks, 60 BBJOs, 40 C2B, 20 Synchro Wall Walks (1 partner working at a time)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604110001', '2026-04-11', 'completed', '25:30:00', 91800, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604130001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front Squat (5x4) first rep 2 second pause (65,70,75,80,82.5%)', '2026-04-13', 'weightlifting', 'rx', 1, 'Front Squat (5x4) first rep 2 second pause (65,70,75,80,82.5%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604130001', '2026-04-13', 'completed', '305', 305, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604130002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 75'' Front Rack Walking Lunges (2x50), 15 HSPU''s, 18 Cal Echo Bike', '2026-04-13', 'metcon', 'for_time', 'rx', 2, '5 RFT: 75'' Front Rack Walking Lunges (2x50), 15 HSPU''s, 18 Cal Echo Bike', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604130002', '2026-04-13', 'completed', '16:44', 1004, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604140001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Bench Press (5x4) pause 3 seconds at top (62,67,72,77,80%)', '2026-04-14', 'weightlifting', 'rx', 1, 'Bench Press (5x4) pause 3 seconds at top (62,67,72,77,80%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604140001', '2026-04-14', 'completed', '225', 225, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604140002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-04-14', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18: 20 Wall Balls, 15 Pull-ups, 10 Power Snatches', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604140002', '2026-04-14', 'completed', '6 rounds', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604150001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Clean (5x3) 1st two reps TnG (70,70,75,80,85%)', '2026-04-15', 'weightlifting', 'rx', 1, 'Power Clean (5x3) 1st two reps TnG (70,70,75,80,85%)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604150001', '2026-04-15', 'completed', '265', 265, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604150002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 4', '2026-04-15', 'metcon', 'for_time', 'rx', 2, 'Every 4:00 x 5 Sets: 400m Run, 15 T2B, 12 Deadlifts', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604150002', '2026-04-15', 'completed', '12:37', 757, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604160001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Snatch (5x3): 1 Snatch, 1 Hang Snatch, 1 Snatch (60,65,70,75,78%)', '2026-04-16', 'weightlifting', 'rx', 1, 'Snatch (5x3): 1 Snatch, 1 Hang Snatch, 1 Snatch (60,65,70,75,78%)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604160002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-04-16', 'metcon', 'for_time', 'rx', 2, 'For time: 2-4-6-8-10-12-14-16-18: Bar Facing Burpees, Hang Power Cleans (115lbs)', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604170001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '3RFT: 800m Run/50Cal Bike/50 Cal Ski (alternating movements each round), 50 Cal ', '2026-04-17', 'metcon', 'for_time', 'rx', 1, '3RFT: 800m Run/50Cal Bike/50 Cal Ski (alternating movements each round), 50 Cal Row, 40 American KB Swings (53lbs), 30 Box Jumps', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604170001', '2026-04-17', 'completed', '34:02:00', 122520, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604180001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2 - 40 min AMRAP', '2026-04-18', 'metcon', 'amrap', 'rx', 1, 'Teams of 2 - 40 min AMRAP: 6 C&Js (185), 8 BJOs, 10 T2B, Every 5 mins both partners run 300m', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604200001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat (5x5) 62,67,72,77,80% rest 2-3mins between sets', '2026-04-20', 'weightlifting', 'rx', 1, 'Back Squat (5x5) 62,67,72,77,80% rest 2-3mins between sets', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604200001', '2026-04-20', 'completed', '345', 345, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604200002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 4 mins x 5 sets', '2026-04-20', 'metcon', 'for_time', 'rx', 2, 'Every 4 mins x 5 sets: 400m Run, 12 Toes to bar, 10 power cleans (135)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604200002', '2026-04-20', 'completed', '12:56', 776, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604210001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Push Jerk: (5x5), 62,67,72,77,80%', '2026-04-21', 'weightlifting', 'rx', 1, 'Push Jerk: (5x5), 62,67,72,77,80%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604210001', '2026-04-21', 'completed', '260', 260, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604210002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 2', '2026-04-21', 'metcon', 'for_time', 'rx', 2, 'Every 2:15 x 10 rounds', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604210002', '2026-04-21', 'completed', '15 Cal row, 15 wallballs (20lbs)', null, null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604220001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Hang Power Clean (6x3) 60,65,70,75,80,82%', '2026-04-22', 'weightlifting', 'rx', 1, 'Hang Power Clean (6x3) 60,65,70,75,80,82%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604220001', '2026-04-22', 'completed', '255', 255, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604220002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30-25-20-15-10-5 Pull-ups, Alt DB Snatches (50), 12 cal bike after each round', '2026-04-22', 'metcon', 'for_time', 'rx', 2, '30-25-20-15-10-5 Pull-ups, Alt DB Snatches (50), 12 cal bike after each round', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604220002', '2026-04-22', 'completed', '12:49', 769, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604230001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift (5x3): 65,70,75,80,85%', '2026-04-23', 'weightlifting', 'rx', 1, 'Deadlift (5x3): 65,70,75,80,85%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604230001', '2026-04-23', 'completed', '435', 435, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604230002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-04-23', 'metcon', 'for_time', 'rx', 2, 'Every 3:00 x 7 sets: 10 front squats (155), 10 HSPU, 15 cal ski', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604240001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-04-24', 'metcon', 'amrap', 'rx', 1, 'For time: 9 squat snatches (155), 15 thrusters (155), 21 clean & jerks (155), rest 3:00, AMRAP 10:00, 100m run, 25'' HSW, rest 2:00, 3 rounds, 125 double unders, 100m Farmers Carry (70)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604240001', '2026-04-24', 'completed', '22:25', 1345, 'scaled', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604270001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Back Squat (5x4) 70,74,78,82,85%', '2026-04-27', 'weightlifting', 'rx', 1, 'Back Squat (5x4) 70,74,78,82,85%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604270001', '2026-04-27', 'completed', '365', 365, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604270002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-04-27', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18:00: 1.2.3.4.5.6. etc wall walks, 15 Box Jump Overs 24, 18 cal row', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604270002', '2026-04-27', 'completed', '7 + 3', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604280001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Snatch (5x5): 65,70,70,75,75%', '2026-04-28', 'weightlifting', 'rx', 1, 'Power Snatch (5x5): 65,70,70,75,75%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604280001', '2026-04-28', 'completed', '185', 185, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604280002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 400m run, 12 dealdifts, 15 C2B', '2026-04-28', 'metcon', 'for_time', 'rx', 2, '5 RFT: 400m run, 12 dealdifts, 15 C2B', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604280002', '2026-04-28', 'completed', '15:44', 944, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604290001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Complex (1 Power Clean + 1 Hang Clean): 70,75,80,82,85%', '2026-04-29', 'weightlifting', 'rx', 1, 'Complex (1 Power Clean + 1 Hang Clean): 70,75,80,82,85%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202604290001', '2026-04-29', 'completed', '275', 275, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604290002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-04-29', 'metcon', 'for_time', 'rx', 2, 'Every 3:30 x 5 sets: 15 cal bike, 15 T2B, 9 Front Squats', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604300001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift (5x3): 72,77,82,85,88%', '2026-04-30', 'weightlifting', 'rx', 1, 'Deadlift (5x3): 72,77,82,85,88%', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202604300002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-04-30', 'metcon', 'emom', 'rx', 2, 'EMOM 20:
Min 1 - 15 cal ski
min 2 - 30'' HSW
Min 3 - 20 Wallballs
Min 4 - 100'' Dbl KB FR carry 70s', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605010001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time ', '2026-05-01', 'metcon', 'for_time', 'rx', 1, 'For time : 1000m row, 50 thrusters (95), 800m run, 40 pull-ups, 600m run, 30 clean & jerks (135), 400m run, 20 BMU''s', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605010001', '2026-05-01', 'completed', '29:11:00', 105060, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605020001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 3', '2026-05-02', 'metcon', 'for_time', 'rx', 1, 'Teams of 3: 5 Rounds: 4:00 Work / 2:00 Rest: 200m run together, 12 synchro front squats (135), 12 synchro bar facing burpees, max cal on bike in remaining time', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605020001', '2026-05-02', 'completed', '196', null, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605040001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Power Snatch Complex: Hang Power Snatch + power Snatch + OHS (6 sets): 60,65,70,70,75,75&', '2026-05-04', 'weightlifting', 'rx', 1, 'Power Snatch Complex: Hang Power Snatch + power Snatch + OHS (6 sets): 60,65,70,70,75,75&', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605040001', '2026-05-04', 'completed', '205', 205, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605040002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 18', '2026-05-04', 'metcon', 'amrap', 'rx', 2, 'AMRAP 18:00: 10 Wall Balls, 12 Pull-ups, 14 Cal Row', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605040002', '2026-05-04', 'completed', '9+9', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605050001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Push Jerk (5x5): 65,65,70,75,75%', '2026-05-05', 'weightlifting', 'rx', 1, 'Push Jerk (5x5): 65,65,70,75,75%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605050001', '2026-05-05', 'completed', '245', 245, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605050002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Crossfit De Mayo', '2026-05-05', 'metcon', 'for_time', 'rx', 2, 'Crossfit De Mayo: Eveery 4:00 x 5 sets: 400m run, 14 Deadlifts (205), 10 GHD''s', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605050002', '2026-05-05', 'completed', '14:57', 897, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605060001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Front squat (4x4): 70,74,78,82%', '2026-05-06', 'weightlifting', 'rx', 1, 'Front squat (4x4): 70,74,78,82%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605060001', '2026-05-06', 'completed', '315', 315, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605060002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 15 cal bike, 12 power cleans, 12 HSPU', '2026-05-06', 'metcon', 'for_time', 'rx', 2, '5 RFT: 15 cal bike, 12 power cleans, 12 HSPU', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605060002', '2026-05-06', 'completed', '12:41', 761, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605070001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Deadlift (5x3): 72,77,82,85,88%', '2026-05-07', 'weightlifting', 'rx', 1, 'Deadlift (5x3): 72,77,82,85,88%', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605070002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EMOM 20', '2026-05-07', 'metcon', 'emom', 'rx', 2, 'EMOM 20:
Min 1 - 15 cal ski
min 2 - 15 box jump overs 24
Min 3 - 12 front squats (135)
Min 4 - :40 DBL DB OH carry 50s', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605080001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-05-08', 'metcon', 'for_time', 'rx', 1, 'For time: 15 squat snatches 9135), 15 BMUs, 30 Cal Bike, Rest 3:00, then: 3 rounds: 200m run, 15 wall balls, 10 burpee pull-ups, rest 2:00, then: 3 rounds: 100 double unders, 100'' farmers carry 70s', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605080001', '2026-05-08', 'completed', '18:52', 1132, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605090001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2, 1 partner working at a time', '2026-05-09', 'metcon', 'for_time', 'rx', 1, 'Teams of 2, 1 partner working at a time:
1500m row, 120 Power snatches (95), 100 T2B, 80 hang power clean and jerks, 600m run together, 50 BBJOs 24, spliit reps however desired', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605090001', '2026-05-09', 'completed', '26:46:00', 96360, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605110001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Snatch (6x2) 65,65,70,70,75,75%', '2026-05-11', 'weightlifting', 'rx', 1, 'Snatch (6x2) 65,65,70,70,75,75%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605110001', '2026-05-11', 'completed', '215', 215, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605110002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Every 3', '2026-05-11', 'metcon', 'for_time', 'rx', 2, 'Every 3:30 x 5 sets: 18 cal row, 5 BMU/RMU alternating sets, 10 OHS (115)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605110002', '2026-05-11', 'completed', '10:16', 616, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605120001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 Complexes: Clean + Hang Clean + Front Squat, 65,65,70,70,75%', '2026-05-12', 'weightlifting', 'rx', 1, '5 Complexes: Clean + Hang Clean + Front Squat, 65,65,70,70,75%', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605120001', '2026-05-12', 'completed', '295', 295, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605120002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-05-12', 'metcon', 'for_time', 'rx', 2, 'For time: 75 cal bike, 60 bar-facing burpees, 50 front squats (135), 35 box jumps', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605120002', '2026-05-12', 'completed', '16:00', 960, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605130001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '4 sets: 30 alt hammer curls, 20 OH DB tricep extensions', '2026-05-13', 'weightlifting', 'rx', 1, '4 sets: 30 alt hammer curls, 20 OH DB tricep extensions', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605130001', '2026-05-13', 'completed', 'Completed', null, false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605130002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'AMRAP 20', '2026-05-13', 'metcon', 'amrap', 'rx', 2, 'AMRAP 20: 30 Air Squats, Row 20 Cals, 100m Farmers Carry (70s)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605130002', '2026-05-13', 'completed', '4+37', null, 'rx', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605140001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Flight simulator: 5-10-15-20-25-30-35-40-45-50-45-40-35-30-25-20-15-10-5 unbroken dubs each set', '2026-05-14', 'weightlifting', 'rx', 1, 'Flight simulator: 5-10-15-20-25-30-35-40-45-50-45-40-35-30-25-20-15-10-5 unbroken dubs each set', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605140002', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '5 RFT: 400m Run, 12 hang power cleans (135), 25 ab mat situps', '2026-05-14', 'metcon', 'for_time', 'rx', 2, '5 RFT: 400m Run, 12 hang power cleans (135), 25 ab mat situps', 'gym');
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605150001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'For time', '2026-05-15', 'metcon', 'amrap', 'rx', 1, 'For time: 20 power snatches, 25 chest to bar pull-ups, 30 cal row, rest 3:00, then AMRAP 10: 200m run, 20 wall balls 5 freehandstanding pushups (amrap is one score), rest 2:00, then 3 rounds 50'' HSW, 3 Rope Climbs (other score is total time)', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605150001', '2026-05-15', 'completed', '25:56, 3 rounds', null, 'rx_plus', false);
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('e3000000-0000-4000-8000-202605160001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Teams of 2, For Time', '2026-05-16', 'metcon', 'for_time', 'rx', 1, 'Teams of 2, For Time: 1000m run together, then split and partition, 100 hang power cleans (115), 100 box jump overs 24, 100 shoulder to overhead (115), 100 T2B, finish with 8 miniute row, alt 1 minute off for max calories (two scores', 'gym');
insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('c0000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-202605160001', '2026-05-16', 'completed', '17:53, 169 row calories', null, 'rx', false);

alter table public.programming enable trigger programming_update_guard;
alter table public.programming_line_item enable trigger pli_update_guard;