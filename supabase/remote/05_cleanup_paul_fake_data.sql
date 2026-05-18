-- Remove seeded / hand-authored Paul data not sourced from SugarWod or Triad Workout Trends.

alter table public.programming disable trigger programming_update_guard;
alter table public.programming_line_item disable trigger pli_update_guard;

-- Fake class-week programming (Jackie, Murph, May extras from 02_paul_auth)
delete from public.athlete_performance
where programming_id in (
  select id from public.programming
  where gym_id = 'a0000000-0000-4000-8000-000000000001'
    and id::text like 'e1000000%'
);

delete from public.programming_line_item
where programming_id in (
  select id from public.programming
  where gym_id = 'a0000000-0000-4000-8000-000000000001'
    and id::text like 'e1000000%'
);

delete from public.programming
where gym_id = 'a0000000-0000-4000-8000-000000000001'
  and id::text like 'e1000000%';

-- Preserve Paul data rebuilt by 03_spreadsheet_import.sql and
-- 04_triad_workout_trends.sql. Standalone PR rows are refreshed in 03; class
-- performances are refreshed in 04 and only fake e100... programming is removed
-- above.

alter table public.programming enable trigger programming_update_guard;
alter table public.programming_line_item enable trigger pli_update_guard;
