-- Rx+/Rx/Fx/Scaled on programming (prescription) and athlete_performance (completion).
-- Strength sessions use athlete_performance.status: completed (default) | failed.

create type public.workout_scale as enum ('rx_plus', 'rx', 'fx', 'scaled');

alter table public.programming
  add column if not exists prescribed_scale public.workout_scale not null default 'rx';

comment on column public.programming.prescribed_scale is
  'Prescribed tier for the workout (Rx+ / Rx / Fx / Scaled). Defaults to Rx for gym class programming.';

alter table public.athlete_performance
  add column if not exists workout_scale public.workout_scale;

comment on column public.athlete_performance.workout_scale is
  'Scale tier the athlete completed (Rx+ / Rx / Fx / Scaled). Null when not logged.';

comment on column public.athlete_performance.status is
  'completed = succeeded lift or finished metcon; failed = missed lift attempt(s); pending = not logged.';
