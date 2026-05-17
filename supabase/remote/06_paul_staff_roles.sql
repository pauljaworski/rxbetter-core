-- Paul Jaworski: athlete + admin + coach + programmer at Triad Training
-- Contact: c0000000-0000-4000-8000-000000000001
-- Gym:     a0000000-0000-4000-8000-000000000001

-- ---- Fitness memberships (one row per role) ----
insert into public.fitness_membership (id, contact_id, gym_id, role, membership_status, join_date)
values
  ('b1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'athlete',    'active', '2024-01-15'),
  ('b1000000-0000-4000-8000-000000000101', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'admin',      'active', '2024-01-15'),
  ('b1000000-0000-4000-8000-000000000102', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'coach',      'active', '2024-01-15'),
  ('b1000000-0000-4000-8000-000000000103', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'programmer', 'active', '2024-01-15')
on conflict (contact_id, gym_id, role) do update
set membership_status = 'active',
    join_date = excluded.join_date,
    updated_at = now();

-- ---- Staff + athlete track entitlements ----
insert into public.athlete_subscription
  (id, contact_id, gym_id, fitness_membership_id, program_library_id, access_level, status, start_date, end_date, subscription_scope)
values
  -- Athlete: Group Class libraries (CrossFit + Hyrox)
  ('d1000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2026-01-01', '2026-12-31', 'athlete_track'),
  ('d1000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2026-01-01', '2026-12-31', 'athlete_track'),
  -- Admin: gym-wide
  ('d1000000-0000-4000-8000-000000000091', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000101', null, 'general', 'active', '2024-01-15', null, 'staff_admin'),
  -- Coach: per library
  ('d1000000-0000-4000-8000-000000000092', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2024-01-15', null, 'staff_coach'),
  ('d1000000-0000-4000-8000-000000000093', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2024-01-15', null, 'staff_coach'),
  -- Programmer: per library
  ('d1000000-0000-4000-8000-000000000094', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000001', 'general', 'active', '2024-01-15', null, 'staff_programmer'),
  ('d1000000-0000-4000-8000-000000000095', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000002', 'general', 'active', '2024-01-15', null, 'staff_programmer')
on conflict (id) do update
set fitness_membership_id = excluded.fitness_membership_id,
    program_library_id = excluded.program_library_id,
    status = excluded.status,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    subscription_scope = excluded.subscription_scope,
    updated_at = now();

-- Commercial membership (Group Class) — idempotent
insert into public.athlete_offering_subscription
  (id, contact_id, gym_id, fitness_membership_id, membership_offering_id, membership_offering_term_id, claimed_from_track_link_id, sold_price_cents, sold_commitment_total_cents, currency, status, auto_renew, start_date, end_date)
values
  ('25000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000004', '24000000-0000-4000-8000-000000000001', 20500, 246000, 'USD', 'active', false, '2026-01-01', '2026-12-31')
on conflict (id) do update
set status = 'active',
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    updated_at = now();

-- Ensure profile points at Triad for gym mode
update public.profiles
set last_active_gym_id = 'a0000000-0000-4000-8000-000000000001',
    last_active_gym_at = now(),
    display_name = 'Paul Jaworski'
where contact_id = 'c0000000-0000-4000-8000-000000000001';
