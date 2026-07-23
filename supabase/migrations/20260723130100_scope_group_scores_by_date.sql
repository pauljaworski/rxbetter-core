-- A segment group can legitimately recur on multiple workout dates.
-- Keep completion identity aligned with athlete performance identity.

drop index if exists public.athlete_segment_completion_group_uidx;

create unique index athlete_segment_completion_group_uidx
  on public.athlete_segment_completion (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null;

create index if not exists athlete_performance_segment_group_date_idx
  on public.athlete_performance (segment_group_id, contact_id, performance_date)
  where segment_group_id is not null;
