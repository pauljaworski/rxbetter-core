-- Phase 2: composable complexes + multi-part segment group scoring

alter table public.programming_line_item
  add column if not exists line_item_kind text not null default 'strength_set',
  add column if not exists movement_components jsonb not null default '[]'::jsonb;

comment on column public.programming_line_item.line_item_kind is
  'strength_set | complex_set | metcon_movement | rest | note — drives athlete logging UX.';
comment on column public.programming_line_item.movement_components is
  'JSON array of { benchmark_type_id, reps, label } for complex_set rows.';

alter table public.athlete_performance
  add column if not exists segment_group_id uuid;

comment on column public.athlete_performance.segment_group_id is
  'When set with programming_id null, score applies to the whole multi-part block.';

create index if not exists athlete_performance_segment_group_idx
  on public.athlete_performance (segment_group_id, contact_id)
  where segment_group_id is not null;

-- Movement exposure inside complexes (reporting)
create or replace view public.pli_movement_components as
select
  pli.id as programming_line_item_id,
  pli.programming_id,
  (elem.value ->> 'benchmark_type_id')::uuid as benchmark_type_id,
  (elem.value ->> 'label') as movement_label,
  ((elem.value ->> 'reps')::int) as reps
from public.programming_line_item pli
cross join lateral jsonb_array_elements(pli.movement_components) as elem(value)
where jsonb_array_length(pli.movement_components) > 0;

-- Segment group results (one row per athlete per group score)
create or replace view public.segment_group_results as
select
  ap.segment_group_id,
  ap.contact_id,
  ap.score,
  ap.result_value,
  ap.workout_scale,
  ap.performance_date,
  ap.id as athlete_performance_id
from public.athlete_performance ap
where ap.segment_group_id is not null
  and ap.programming_line_item_id is null;
