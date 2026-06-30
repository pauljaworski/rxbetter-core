-- Segment group identifiers are editor-generated and can be reused by copied WODs.
-- Completion uniqueness must include performance_date so a reused group id does not
-- block or overwrite an athlete's score/completion on another date.

drop index if exists public.athlete_segment_completion_group_uidx;

create unique index if not exists athlete_segment_completion_group_date_uidx
  on public.athlete_segment_completion (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null;

create index if not exists athlete_performance_segment_group_date_idx
  on public.athlete_performance (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null;
