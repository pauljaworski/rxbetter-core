-- ============================================================
-- RxBetter test data — Triad Training, Paul & Brooke Jaworski
-- Full week: Apr 14–18, 2026 (Mon–Fri)
-- Today (Wed Apr 16): 5x2 Snatch @ 70-80%, completed
-- ============================================================

-- ---- 1. Gym ----
insert into public.gym (id, name, subscription_status, subscription_plan)
values ('a0000000-0000-4000-8000-000000000001', 'Triad Training', 'active', 'pro');

-- ---- 2. Contacts ----
insert into public.contact (id, first_name, last_name, email, phone) values
  ('c0000000-0000-4000-8000-000000000001', 'Paul',   'Jaworski', 'paul@triadtraining.com',   '555-0101'),
  ('c0000000-0000-4000-8000-000000000002', 'Brooke', 'Jaworski', 'brooke@triadtraining.com', '555-0102');

-- ---- 3. Program Library ----
insert into public.program_library (id, gym_id, name, description, sport_type, is_active) values
  ('10000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001',
   'Triad Competitors', 'Strength + metcon daily programming for competitive athletes',
   'crossfit', true);

-- ---- 4. Fitness Memberships ----
insert into public.fitness_membership (id, contact_id, gym_id, role, membership_status, join_date) values
  ('b1000000-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001',
   'athlete', 'active', '2024-01-15'),
  ('b1000000-0000-4000-8000-000000000002',
   'c0000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001',
   'athlete', 'active', '2024-01-15');

-- ---- 5. Athlete Subscriptions ----
insert into public.athlete_subscription
  (id, contact_id, gym_id, fitness_membership_id, program_library_id, access_level, status, start_date) values
  ('d1000000-0000-4000-8000-000000000001',
   'c0000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'individualized', 'active', '2024-01-15'),
  ('d1000000-0000-4000-8000-000000000002',
   'c0000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001',
   'individualized', 'active', '2024-01-15');

-- ---- 6. Athlete Benchmark Summaries (existing PRs for context) ----
-- Paul: Snatch 1RM = 225, Back Squat 1RM = 405, Deadlift 1RM = 500, Clean 1RM = 315
-- Brooke: Snatch 1RM = 145, Back Squat 1RM = 255, Deadlift 1RM = 315, Clean 1RM = 195
insert into public.athlete_benchmark_summary
  (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved) values
  -- Paul
  ('c0000000-0000-4000-8000-000000000001',
   (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 1),
   225, '2025-11-08'),
  ('c0000000-0000-4000-8000-000000000001',
   (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 1),
   405, '2025-12-02'),
  ('c0000000-0000-4000-8000-000000000001',
   (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 1),
   500, '2026-01-20'),
  ('c0000000-0000-4000-8000-000000000001',
   (select id from public.benchmark_definition where benchmark_type_id = '55c62d0d-21f6-40d4-8fa5-f12571e705e4' and rep_count = 1),
   315, '2025-10-15'),
  -- Brooke
  ('c0000000-0000-4000-8000-000000000002',
   (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 1),
   145, '2025-11-08'),
  ('c0000000-0000-4000-8000-000000000002',
   (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 1),
   255, '2025-12-02'),
  ('c0000000-0000-4000-8000-000000000002',
   (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 1),
   315, '2026-01-20'),
  ('c0000000-0000-4000-8000-000000000002',
   (select id from public.benchmark_definition where benchmark_type_id = '55c62d0d-21f6-40d4-8fa5-f12571e705e4' and rep_count = 1),
   195, '2025-10-15');

-- ============================================================
-- MONDAY Apr 14 — Back Squat 5x3 @ 80% + Fran
-- ============================================================
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, display_order, description, coaches_notes) values
  ('e1000000-0000-4000-8000-000000010001',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Back Squat 5x3 @ 80%', '2026-04-14', 'weightlifting', 1,
   'Build to 80% of 1RM. All sets at same weight. Rest 2-3 min between sets.',
   'Focus on depth and bracing. No belts until set 4.');

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, display_order, description) values
  ('e1000000-0000-4000-8000-000000010002',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Fran', '2026-04-14', 'metcon', 'for_time', 2,
   '21-15-9: Thrusters (95/65) & Pull-Ups');

-- Mon strength line items (5 sets x 3 reps Back Squat)
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000001010001', 'e1000000-0000-4000-8000-000000010001', '74594e1c-97cf-4727-89ae-7795f80459df', 1, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010002', 'e1000000-0000-4000-8000-000000010001', '74594e1c-97cf-4727-89ae-7795f80459df', 2, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010003', 'e1000000-0000-4000-8000-000000010001', '74594e1c-97cf-4727-89ae-7795f80459df', 3, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010004', 'e1000000-0000-4000-8000-000000010001', '74594e1c-97cf-4727-89ae-7795f80459df', 4, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010005', 'e1000000-0000-4000-8000-000000010001', '74594e1c-97cf-4727-89ae-7795f80459df', 5, 3, 0.80, 'completed');

-- Mon Fran line item
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000001010006', 'e1000000-0000-4000-8000-000000010002',
   'd3430484-f9f5-4841-9d3b-b943bb872fea', 1, '21-15-9 For Time', 'completed');

-- Mon performances — Paul (BS @ 325, Fran 3:42)
insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010001', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 325, 3, 0.80, 7),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010002', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 325, 3, 0.80, 7),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010003', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 325, 3, 0.80, 8),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010004', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 325, 3, 0.80, 8),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010005', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 325, 3, 0.80, 9);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000010002', 'f1000000-0000-4000-8000-000001010006', 'd3430484-f9f5-4841-9d3b-b943bb872fea', '2026-04-14', 'completed', '3:42 Rx', 222, 10);

-- Mon performances — Brooke (BS @ 205, Fran 5:18)
insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010001', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010002', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010003', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010004', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010005', '74594e1c-97cf-4727-89ae-7795f80459df', (select id from public.benchmark_definition where benchmark_type_id = '74594e1c-97cf-4727-89ae-7795f80459df' and rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 9);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010002', 'f1000000-0000-4000-8000-000001010006', 'd3430484-f9f5-4841-9d3b-b943bb872fea', '2026-04-14', 'completed', '5:18 Rx', 318, 9);

-- ============================================================
-- TUESDAY Apr 15 — Deadlift 3x5 @ 75% + Helen
-- ============================================================
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, display_order, description) values
  ('e1000000-0000-4000-8000-000000020001',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Deadlift 3x5 @ 75%', '2026-04-15', 'weightlifting', 1,
   'Conventional deadlift. Reset each rep. No touch-and-go.');

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, display_order, description) values
  ('e1000000-0000-4000-8000-000000020002',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Helen', '2026-04-15', 'metcon', 'for_time', 2,
   '3 RFT: 400m Run, 21 KBS (53/35), 12 Pull-Ups');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000002010001', 'e1000000-0000-4000-8000-000000020001', '0e6de3ce-c0fa-4549-aaba-c674193572fc', 1, 5, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000002010002', 'e1000000-0000-4000-8000-000000020001', '0e6de3ce-c0fa-4549-aaba-c674193572fc', 2, 5, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000002010003', 'e1000000-0000-4000-8000-000000020001', '0e6de3ce-c0fa-4549-aaba-c674193572fc', 3, 5, 0.75, 'completed');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000002010004', 'e1000000-0000-4000-8000-000000020002', '33916178-e87a-4407-84ad-26f767586be0', 1, '3 RFT For Time', 'completed');

-- Tue performances — Paul (DL @ 375, Helen 8:22)
insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010001', '0e6de3ce-c0fa-4549-aaba-c674193572fc', (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 5), '2026-04-15', 'completed', 375, 5, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010002', '0e6de3ce-c0fa-4549-aaba-c674193572fc', (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 5), '2026-04-15', 'completed', 375, 5, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010003', '0e6de3ce-c0fa-4549-aaba-c674193572fc', (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 5), '2026-04-15', 'completed', 375, 5, 0.75, 8);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000020002', 'f1000000-0000-4000-8000-000002010004', '33916178-e87a-4407-84ad-26f767586be0', '2026-04-15', 'completed', '8:22 Rx', 502, 9);

-- Tue performances — Brooke (DL @ 235, Helen 9:55)
insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010001', '0e6de3ce-c0fa-4549-aaba-c674193572fc', (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 5), '2026-04-15', 'completed', 235, 5, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010002', '0e6de3ce-c0fa-4549-aaba-c674193572fc', (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 5), '2026-04-15', 'completed', 235, 5, 0.75, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010003', '0e6de3ce-c0fa-4549-aaba-c674193572fc', (select id from public.benchmark_definition where benchmark_type_id = '0e6de3ce-c0fa-4549-aaba-c674193572fc' and rep_count = 5), '2026-04-15', 'completed', 235, 5, 0.75, 8);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020002', 'f1000000-0000-4000-8000-000002010004', '33916178-e87a-4407-84ad-26f767586be0', '2026-04-15', 'completed', '9:55 Rx', 595, 9);

-- ============================================================
-- WEDNESDAY Apr 16 (today) — Snatch 5x2 @ 70-80% + Annie
-- ============================================================
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, display_order, description, coaches_notes) values
  ('e1000000-0000-4000-8000-000000030001',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Snatch 5x2 @ 70-80%', '2026-04-16', 'weightlifting', 1,
   'Build from 70% to 80% across 5 sets of 2. Full squat snatch.',
   'Work positions over speed. Pause in the catch if needed.');

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, display_order, description) values
  ('e1000000-0000-4000-8000-000000030002',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Annie', '2026-04-16', 'metcon', 'for_time', 2,
   '50-40-30-20-10: Double Unders & Sit-Ups');

-- Wed snatch line items (5 sets x 2 reps, building 70->75->75->78->80%)
insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000003010001', 'e1000000-0000-4000-8000-000000030001', '226dc09e-fa68-4502-b514-fccec7e27c37', 1, 2, 0.70, 'completed'),
  ('f1000000-0000-4000-8000-000003010002', 'e1000000-0000-4000-8000-000000030001', '226dc09e-fa68-4502-b514-fccec7e27c37', 2, 2, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000003010003', 'e1000000-0000-4000-8000-000000030001', '226dc09e-fa68-4502-b514-fccec7e27c37', 3, 2, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000003010004', 'e1000000-0000-4000-8000-000000030001', '226dc09e-fa68-4502-b514-fccec7e27c37', 4, 2, 0.78, 'completed'),
  ('f1000000-0000-4000-8000-000003010005', 'e1000000-0000-4000-8000-000000030001', '226dc09e-fa68-4502-b514-fccec7e27c37', 5, 2, 0.80, 'completed');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000003010006', 'e1000000-0000-4000-8000-000000030002', 'a292322a-18a4-494c-b7d1-f4e487d50e0f', 1, '50-40-30-20-10 For Time', 'completed');

-- Wed performances — Paul (Snatch building 155->170->170->175->180, Annie 6:45)
insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010001', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 155, 2, 0.70, 6),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010002', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 170, 2, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010003', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 170, 2, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010004', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 175, 2, 0.78, 8),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010005', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 180, 2, 0.80, 9);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000030002', 'f1000000-0000-4000-8000-000003010006', 'a292322a-18a4-494c-b7d1-f4e487d50e0f', '2026-04-16', 'completed', '6:45', 405, 8);

-- Wed performances — Brooke (Snatch building 100->110->110->113->115, Annie 7:30)
insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010001', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 100, 2, 0.70, 6),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010002', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 110, 2, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010003', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 110, 2, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010004', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 113, 2, 0.78, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010005', '226dc09e-fa68-4502-b514-fccec7e27c37', (select id from public.benchmark_definition where benchmark_type_id = '226dc09e-fa68-4502-b514-fccec7e27c37' and rep_count = 2), '2026-04-16', 'completed', 115, 2, 0.80, 9);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030002', 'f1000000-0000-4000-8000-000003010006', 'a292322a-18a4-494c-b7d1-f4e487d50e0f', '2026-04-16', 'completed', '7:30', 450, 8);

-- ============================================================
-- THURSDAY Apr 17 — Clean & Jerk 4x2 @ 75% + DT
-- ============================================================
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, display_order, description) values
  ('e1000000-0000-4000-8000-000000040001',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Clean & Jerk 4x2 @ 75%', '2026-04-17', 'weightlifting', 1,
   'Full clean + split jerk. 2 min rest between sets.');

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, display_order, description) values
  ('e1000000-0000-4000-8000-000000040002',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'DT', '2026-04-17', 'metcon', 'for_time', 2,
   '5 RFT: 12 Deadlifts (155/105), 9 Hang Power Cleans, 6 Push Jerks');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000004010001', 'e1000000-0000-4000-8000-000000040001', '1745a801-5215-422d-8437-ee3b40d1ea4d', 1, 2, 0.75, 'pending'),
  ('f1000000-0000-4000-8000-000004010002', 'e1000000-0000-4000-8000-000000040001', '1745a801-5215-422d-8437-ee3b40d1ea4d', 2, 2, 0.75, 'pending'),
  ('f1000000-0000-4000-8000-000004010003', 'e1000000-0000-4000-8000-000000040001', '1745a801-5215-422d-8437-ee3b40d1ea4d', 3, 2, 0.75, 'pending'),
  ('f1000000-0000-4000-8000-000004010004', 'e1000000-0000-4000-8000-000000040001', '1745a801-5215-422d-8437-ee3b40d1ea4d', 4, 2, 0.75, 'pending');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000004010005', 'e1000000-0000-4000-8000-000000040002', 'e7c84ca5-9590-41f9-92fa-ccfe34635c01', 1, '5 RFT For Time', 'pending');

-- ============================================================
-- FRIDAY Apr 18 — Front Squat 5x5 @ 70% + Cindy (20 min AMRAP)
-- ============================================================
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, display_order, description) values
  ('e1000000-0000-4000-8000-000000050001',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Front Squat 5x5 @ 70%', '2026-04-18', 'weightlifting', 1,
   'Tempo front squats. 3 seconds down, 1 second pause at bottom. Same weight all sets.');

insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, display_order, description) values
  ('e1000000-0000-4000-8000-000000050002',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'Cindy', '2026-04-18', 'metcon', 'amrap', 2,
   '20 min AMRAP: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000005010001', 'e1000000-0000-4000-8000-000000050001', '360a222c-3875-4ab1-b4e5-6a62a16f3a5c', 1, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010002', 'e1000000-0000-4000-8000-000000050001', '360a222c-3875-4ab1-b4e5-6a62a16f3a5c', 2, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010003', 'e1000000-0000-4000-8000-000000050001', '360a222c-3875-4ab1-b4e5-6a62a16f3a5c', 3, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010004', 'e1000000-0000-4000-8000-000000050001', '360a222c-3875-4ab1-b4e5-6a62a16f3a5c', 4, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010005', 'e1000000-0000-4000-8000-000000050001', '360a222c-3875-4ab1-b4e5-6a62a16f3a5c', 5, 5, 0.70, 'pending');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000005010006', 'e1000000-0000-4000-8000-000000050002', '049ada5f-eb1b-4f42-9e35-90aff5ae1dcd', 1, '20 min AMRAP', 'pending');
