-- Link logged-in user (pauljaworski91@gmail.com) to Triad Paul
-- Paul contact: c0000000-0000-4000-8000-000000000001
-- Auth user:  f5321db3-262b-4803-9403-5e2a0877160d
-- PRs / performances: 03_spreadsheet_import.sql + 04_triad_workout_trends.sql

update public.contact
set user_id = null
where user_id = 'f5321db3-262b-4803-9403-5e2a0877160d'
  and id <> 'c0000000-0000-4000-8000-000000000001';

update public.contact
set user_id = 'f5321db3-262b-4803-9403-5e2a0877160d',
    email = 'pauljaworski91@gmail.com',
    first_name = 'Paul',
    last_name = 'Jaworski'
where id = 'c0000000-0000-4000-8000-000000000001';

update public.profiles
set contact_id = 'c0000000-0000-4000-8000-000000000001',
    display_name = 'Paul Jaworski',
    last_active_gym_id = 'a0000000-0000-4000-8000-000000000001',
    last_active_gym_at = now()
where id = 'f5321db3-262b-4803-9403-5e2a0877160d';

delete from public.contact
where id = '0a112854-9b0c-484d-b5ab-40593c7a5565';

-- Athlete/staff entitlements: see 06_paul_staff_roles.sql
