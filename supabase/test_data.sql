-- ============================================================
-- RxBetter test data — Triad Training memberships, links, and training week
-- ============================================================

-- ---- 1. Gym ----
insert into public.gym (id, name, subscription_status, subscription_plan)
values ('a0000000-0000-4000-8000-000000000001', 'Triad Training', 'active', 'pro');

-- ---- 2. Contacts ----
insert into public.contact (id, first_name, last_name, email, phone) values
  ('c0000000-0000-4000-8000-000000000001', 'Paul',   'Jaworski', 'paul@triadtraining.com',     '555-0101'),
  ('c0000000-0000-4000-8000-000000000002', 'Brooke', 'Jaworski', 'brooke@triadtraining.com',   '555-0102'),
  ('c0000000-0000-4000-8000-000000000003', 'Jordan', 'Miles',    'jordan@triadtraining.com',   '555-0103'),
  ('c0000000-0000-4000-8000-000000000004', 'Casey',  'Rivera',   'casey@triadtraining.com',    '555-0104'),
  ('c0000000-0000-4000-8000-000000000005', 'Taylor', 'Nguyen',   'taylor@triadtraining.com',   '555-0105'),
  ('c0000000-0000-4000-8000-000000000010', 'Alex',   'Triad',    'alex@triadtraining.com',     '555-0110'),
  ('c0000000-0000-4000-8000-000000000011', 'Riley',  'Coach',    'riley@triadtraining.com',    '555-0111');

-- ---- 3. Program Libraries ----
insert into public.program_library (id, gym_id, name, description, sport_type, is_active) values
  ('10000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001',
   'CrossFit', 'Daily strength + metcon class programming for Triad athletes',
   'crossfit', true),
  ('10000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001',
   'Hyrox', 'Engine, running, and race-specific conditioning sessions',
   'hyrox', true);

-- ---- 4. Membership Offerings ----
insert into public.membership_offering
  (id, gym_id, name, description, is_active, created_by_contact_id) values
  ('21000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001',
   'Group Class',
   'Triad group training membership. Includes both CrossFit and Hyrox program libraries.',
   true,
   'c0000000-0000-4000-8000-000000000010'),
  ('21000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001',
   'Open Gym',
   'Independent gym usage during standard access hours.',
   true,
   'c0000000-0000-4000-8000-000000000010'),
  ('21000000-0000-4000-8000-000000000003',
   'a0000000-0000-4000-8000-000000000001',
   '24/7 Access',
   'Extended facility access benefit for members who need round-the-clock entry.',
   true,
   'c0000000-0000-4000-8000-000000000010');

insert into public.membership_offering_term
  (id, membership_offering_id, term_months, price_cents, currency, billing_type, is_active) values
  -- Group Class
  ('22000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 1, 25000, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000001', 3, 23500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000001', 6, 22500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000001', 12, 20500, 'USD', 'monthly_commitment', true),
  -- Open Gym
  ('22000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000002', 1, 15000, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000006', '21000000-0000-4000-8000-000000000002', 3, 13500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000007', '21000000-0000-4000-8000-000000000002', 6, 12500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000008', '21000000-0000-4000-8000-000000000002', 12, 10500, 'USD', 'monthly_commitment', true),
  -- 24/7 Access
  ('22000000-0000-4000-8000-000000000009', '21000000-0000-4000-8000-000000000003', 1, 17500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000010', '21000000-0000-4000-8000-000000000003', 3, 15500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000011', '21000000-0000-4000-8000-000000000003', 6, 14500, 'USD', 'monthly_commitment', true),
  ('22000000-0000-4000-8000-000000000012', '21000000-0000-4000-8000-000000000003', 12, 12500, 'USD', 'monthly_commitment', true);

insert into public.membership_offering_component
  (id, membership_offering_id, component_type, program_library_id, capability_code) values
  ('23000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'program_library', '10000000-0000-4000-8000-000000000001', null),
  ('23000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000001', 'program_library', '10000000-0000-4000-8000-000000000002', null),
  ('23000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000002', 'capability', null, 'open_gym'),
  ('23000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000003', 'capability', null, 'access_24_7');

-- ---- 5. Fitness Track Links ----
insert into public.fitness_track_link
  (id, gym_id, label, created_by_contact_id, max_redemptions, redemption_count) values
  ('24000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Triad Group Class Enrollment', 'c0000000-0000-4000-8000-000000000010', 200, 0),
  ('24000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Triad Open Gym Enrollment',   'c0000000-0000-4000-8000-000000000010', 200, 0),
  ('24000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Triad 24/7 Access Enrollment','c0000000-0000-4000-8000-000000000010', 200, 0),
  ('24000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Triad Membership Picker',     'c0000000-0000-4000-8000-000000000010', 200, 0);

insert into public.fitness_track_link_option
  (link_id, membership_offering_term_id) values
  -- Group Class link
  ('24000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001'),
  ('24000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000002'),
  ('24000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000003'),
  ('24000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000004'),
  -- Open Gym link
  ('24000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000005'),
  ('24000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000006'),
  ('24000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000007'),
  ('24000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000008'),
  -- 24/7 Access link
  ('24000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000009'),
  ('24000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000010'),
  ('24000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000011'),
  ('24000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000012'),
  -- Mixed picker link
  ('24000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000002'),
  ('24000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000006'),
  ('24000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000010');

-- ---- 6. Fitness Memberships ----
insert into public.fitness_membership (id, contact_id, gym_id, role, membership_status, join_date) values
  ('b1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'athlete',    'active', '2024-01-15'),
  ('b1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'athlete',    'active', '2024-02-01'),
  ('b1000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'athlete',    'active', '2026-03-01'),
  ('b1000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'athlete',    'active', '2026-04-01'),
  ('b1000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'athlete',    'active', '2026-04-01'),
  ('b1000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001', 'admin',      'active', '2023-01-01'),
  ('b1000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'programmer', 'active', '2023-06-01');

-- ---- 7. Staff + Athlete Track Entitlements ----
insert into public.athlete_subscription
  (id, contact_id, gym_id, fitness_membership_id, program_library_id, access_level, status, start_date, end_date, subscription_scope) values
  -- Staff admin / programmer
  ('d1000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000010', null, 'general', 'active', '2023-01-01', null, 'staff_admin'),
  ('d1000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2023-06-01', null, 'staff_programmer'),
  ('d1000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2023-06-01', null, 'staff_programmer'),
  -- Group Class athletes get both CrossFit + Hyrox
  ('d1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2026-01-01', '2026-12-31', 'athlete_track'),
  ('d1000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2026-01-01', '2026-12-31', 'athlete_track'),
  ('d1000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2026-02-01', '2026-07-31', 'athlete_track'),
  ('d1000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2026-02-01', '2026-07-31', 'athlete_track'),
  ('d1000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2026-04-01', '2026-06-30', 'athlete_track'),
  ('d1000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2026-04-01', '2026-06-30', 'athlete_track');

-- ---- 8. Purchased Offerings (commercial snapshot) ----
insert into public.athlete_offering_subscription
  (id, contact_id, gym_id, fitness_membership_id, membership_offering_id, membership_offering_term_id, claimed_from_track_link_id, sold_price_cents, sold_commitment_total_cents, currency, status, auto_renew, start_date, end_date) values
  -- Paul: Group Class only
  ('25000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000004', '24000000-0000-4000-8000-000000000001', 20500, 246000, 'USD', 'active', false, '2026-01-01', '2026-12-31'),
  -- Brooke: Group Class + Open Gym
  ('25000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000003', '24000000-0000-4000-8000-000000000001', 22500, 135000, 'USD', 'active', false, '2026-02-01', '2026-07-31'),
  ('25000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000007', '24000000-0000-4000-8000-000000000002', 12500, 75000, 'USD', 'active', false, '2026-02-01', '2026-07-31'),
  -- Jordan: Open Gym only
  ('25000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000006', '24000000-0000-4000-8000-000000000002', 13500, 40500, 'USD', 'active', false, '2026-03-01', '2026-05-31'),
  -- Casey: 24/7 only
  ('25000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000009', '24000000-0000-4000-8000-000000000003', 17500, 17500, 'USD', 'active', false, '2026-04-01', '2026-04-30'),
  -- Taylor: all three from the mixed picker link
  ('25000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000002', '24000000-0000-4000-8000-000000000004', 23500, 70500, 'USD', 'active', false, '2026-04-01', '2026-06-30'),
  ('25000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000006', '24000000-0000-4000-8000-000000000004', 13500, 40500, 'USD', 'active', false, '2026-04-01', '2026-06-30'),
  ('25000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000010', '24000000-0000-4000-8000-000000000004', 15500, 46500, 'USD', 'active', false, '2026-04-01', '2026-06-30');

-- ---- 9. Capability Grants ----
insert into public.contact_gym_capability_grant
  (id, contact_id, gym_id, fitness_membership_id, athlete_offering_subscription_id, capability_code, status, start_date, end_date) values
  ('26000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', '25000000-0000-4000-8000-000000000003', 'open_gym',      'active', '2026-02-01', '2026-07-31'),
  ('26000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', '25000000-0000-4000-8000-000000000004', 'open_gym',      'active', '2026-03-01', '2026-05-31'),
  ('26000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004', '25000000-0000-4000-8000-000000000005', 'access_24_7',  'active', '2026-04-01', '2026-04-30'),
  ('26000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '25000000-0000-4000-8000-000000000007', 'open_gym',      'active', '2026-04-01', '2026-06-30'),
  ('26000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000005', '25000000-0000-4000-8000-000000000008', 'access_24_7',  'active', '2026-04-01', '2026-06-30');

-- ---- 10. Athlete Benchmark Summaries (existing PRs for context) ----
-- Paul: loaded via scripts/import-paul-spreadsheet-data.mjs (SugarWod export)
insert into public.athlete_benchmark_summary
  (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved) values
  -- Brooke
  ('c0000000-0000-4000-8000-000000000002',
   (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 1),
   145, '2025-11-08'),
  ('c0000000-0000-4000-8000-000000000002',
   (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 1),
   255, '2025-12-02'),
  ('c0000000-0000-4000-8000-000000000002',
   (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Deadlift' and bd.rep_count = 1),
   315, '2026-01-20'),
  ('c0000000-0000-4000-8000-000000000002',
   (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Clean' and bd.rep_count = 1),
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

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000001010001', 'e1000000-0000-4000-8000-000000010001', (select id from public.benchmark_type where name = 'Back Squat'), 1, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010002', 'e1000000-0000-4000-8000-000000010001', (select id from public.benchmark_type where name = 'Back Squat'), 2, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010003', 'e1000000-0000-4000-8000-000000010001', (select id from public.benchmark_type where name = 'Back Squat'), 3, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010004', 'e1000000-0000-4000-8000-000000010001', (select id from public.benchmark_type where name = 'Back Squat'), 4, 3, 0.80, 'completed'),
  ('f1000000-0000-4000-8000-000001010005', 'e1000000-0000-4000-8000-000000010001', (select id from public.benchmark_type where name = 'Back Squat'), 5, 3, 0.80, 'completed');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000001010006', 'e1000000-0000-4000-8000-000000010002',
   (select id from public.benchmark_type where name = 'Fran'), 1, '21-15-9 For Time', 'completed');

-- Paul class results: import via scripts/import-triad-workout-trends.mjs

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010002', 'f1000000-0000-4000-8000-000001010006', (select id from public.benchmark_type where name = 'Fran'), '2026-04-14', 'completed', '5:18 Rx', 318, 9);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010001', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010002', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010003', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010004', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000010001', 'f1000000-0000-4000-8000-000001010005', (select id from public.benchmark_type where name = 'Back Squat'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Back Squat' and bd.rep_count = 3), '2026-04-14', 'completed', 205, 3, 0.80, 9);

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
  ('f1000000-0000-4000-8000-000002010001', 'e1000000-0000-4000-8000-000000020001', (select id from public.benchmark_type where name = 'Deadlift'), 1, 5, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000002010002', 'e1000000-0000-4000-8000-000000020001', (select id from public.benchmark_type where name = 'Deadlift'), 2, 5, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000002010003', 'e1000000-0000-4000-8000-000000020001', (select id from public.benchmark_type where name = 'Deadlift'), 3, 5, 0.75, 'completed');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000002010004', 'e1000000-0000-4000-8000-000000020002', (select id from public.benchmark_type where name = 'Helen'), 1, '3 RFT For Time', 'completed');

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010001', (select id from public.benchmark_type where name = 'Deadlift'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Deadlift' and bd.rep_count = 5), '2026-04-15', 'completed', 235, 5, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010002', (select id from public.benchmark_type where name = 'Deadlift'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Deadlift' and bd.rep_count = 5), '2026-04-15', 'completed', 235, 5, 0.75, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020001', 'f1000000-0000-4000-8000-000002010003', (select id from public.benchmark_type where name = 'Deadlift'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Deadlift' and bd.rep_count = 5), '2026-04-15', 'completed', 235, 5, 0.75, 8);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000020002', 'f1000000-0000-4000-8000-000002010004', (select id from public.benchmark_type where name = 'Helen'), '2026-04-15', 'completed', '9:55 Rx', 595, 9);

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

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status) values
  ('f1000000-0000-4000-8000-000003010001', 'e1000000-0000-4000-8000-000000030001', (select id from public.benchmark_type where name = 'Snatch'), 1, 2, 0.70, 'completed'),
  ('f1000000-0000-4000-8000-000003010002', 'e1000000-0000-4000-8000-000000030001', (select id from public.benchmark_type where name = 'Snatch'), 2, 2, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000003010003', 'e1000000-0000-4000-8000-000000030001', (select id from public.benchmark_type where name = 'Snatch'), 3, 2, 0.75, 'completed'),
  ('f1000000-0000-4000-8000-000003010004', 'e1000000-0000-4000-8000-000000030001', (select id from public.benchmark_type where name = 'Snatch'), 4, 2, 0.78, 'completed'),
  ('f1000000-0000-4000-8000-000003010005', 'e1000000-0000-4000-8000-000000030001', (select id from public.benchmark_type where name = 'Snatch'), 5, 2, 0.80, 'completed');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000003010006', 'e1000000-0000-4000-8000-000000030002', (select id from public.benchmark_type where name = 'Annie'), 1, '50-40-30-20-10 For Time', 'completed');

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, reps_prescribed, prescribed_percentage, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010001', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), '2026-04-16', 'completed', 100, 2, 0.70, 6),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010002', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), '2026-04-16', 'completed', 110, 2, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010003', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), '2026-04-16', 'completed', 110, 2, 0.75, 7),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010004', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), '2026-04-16', 'completed', 113, 2, 0.78, 8),
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030001', 'f1000000-0000-4000-8000-000003010005', (select id from public.benchmark_type where name = 'Snatch'), (select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = 'Snatch' and bd.rep_count = 2), '2026-04-16', 'completed', 115, 2, 0.80, 9);

insert into public.athlete_performance
  (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, rpe) values
  ('c0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000030002', 'f1000000-0000-4000-8000-000003010006', (select id from public.benchmark_type where name = 'Annie'), '2026-04-16', 'completed', '7:30', 450, 8);

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
  ('f1000000-0000-4000-8000-000004010001', 'e1000000-0000-4000-8000-000000040001', (select id from public.benchmark_type where name = 'Clean & Jerk'), 1, 2, 0.75, 'pending'),
  ('f1000000-0000-4000-8000-000004010002', 'e1000000-0000-4000-8000-000000040001', (select id from public.benchmark_type where name = 'Clean & Jerk'), 2, 2, 0.75, 'pending'),
  ('f1000000-0000-4000-8000-000004010003', 'e1000000-0000-4000-8000-000000040001', (select id from public.benchmark_type where name = 'Clean & Jerk'), 3, 2, 0.75, 'pending'),
  ('f1000000-0000-4000-8000-000004010004', 'e1000000-0000-4000-8000-000000040001', (select id from public.benchmark_type where name = 'Clean & Jerk'), 4, 2, 0.75, 'pending');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000004010005', 'e1000000-0000-4000-8000-000000040002', (select id from public.benchmark_type where name = 'DT'), 1, '5 RFT For Time', 'pending');

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
  ('f1000000-0000-4000-8000-000005010001', 'e1000000-0000-4000-8000-000000050001', (select id from public.benchmark_type where name = 'Front Squat'), 1, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010002', 'e1000000-0000-4000-8000-000000050001', (select id from public.benchmark_type where name = 'Front Squat'), 2, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010003', 'e1000000-0000-4000-8000-000000050001', (select id from public.benchmark_type where name = 'Front Squat'), 3, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010004', 'e1000000-0000-4000-8000-000000050001', (select id from public.benchmark_type where name = 'Front Squat'), 4, 5, 0.70, 'pending'),
  ('f1000000-0000-4000-8000-000005010005', 'e1000000-0000-4000-8000-000000050001', (select id from public.benchmark_type where name = 'Front Squat'), 5, 5, 0.70, 'pending');

insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000005010006', 'e1000000-0000-4000-8000-000000050002', (select id from public.benchmark_type where name = 'Cindy'), 1, '20 min AMRAP', 'pending');

-- ---- 11. Hyrox example session so Group Class bundle exposes both libraries ----
insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, display_order, description) values
  ('e1000000-0000-4000-8000-000000060001',
   'a0000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   'Hyrox Engine Builder', '2026-04-19', 'metcon', 1,
   '3 rounds: 1000m row, 50 wall balls, 200m sled push, 800m run.');

insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status) values
  ('f1000000-0000-4000-8000-000006010001', 'e1000000-0000-4000-8000-000000060001', 1, '3 rounds for quality', 'pending');
