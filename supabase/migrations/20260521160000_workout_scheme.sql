-- Metcon structure: JSONB scheme + optional multi-part grouping (Phase 1).

alter table public.programming
  add column if not exists workout_scheme jsonb not null default '{}'::jsonb,
  add column if not exists segment_group_id uuid,
  add column if not exists group_score_anchor boolean not null default false,
  add column if not exists programming_subtype text;

comment on column public.programming.workout_scheme is
  'Structured metcon/HIIT prescription (rounds, caps, intervals). Validated in app via workout-scheme-schema.';
comment on column public.programming.segment_group_id is
  'Shared UUID linking multiple programming rows into one workout block (e.g. multi-part for time).';
comment on column public.programming.group_score_anchor is
  'When true, this segment row is the score anchor for segment_group_id (Phase 2 group logging).';
comment on column public.programming.programming_subtype is
  'UI subtype when programming_segment is metcon (e.g. hiit). Not a separate DB segment enum.';

create index if not exists programming_segment_group_idx
  on public.programming (segment_group_id)
  where segment_group_id is not null;
