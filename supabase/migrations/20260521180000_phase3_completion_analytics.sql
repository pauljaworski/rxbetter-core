-- Phase 3: per-athlete segment completion + optional score breakdown + analytics views

alter table public.athlete_performance
  add column if not exists score_meta jsonb not null default '{}'::jsonb;

comment on column public.athlete_performance.score_meta is
  'Optional JSON breakdown (e.g. interval round times) for charts; score remains display string.';

create table if not exists public.athlete_segment_completion (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contact(id) on delete cascade,
  programming_id uuid references public.programming(id) on delete cascade,
  segment_group_id uuid,
  performance_date date not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.athlete_segment_completion is
  'Per-athlete segment or multi-part block marked complete when all required performances are logged.';

create unique index if not exists athlete_segment_completion_prog_uidx
  on public.athlete_segment_completion (contact_id, programming_id)
  where programming_id is not null;

create unique index if not exists athlete_segment_completion_group_uidx
  on public.athlete_segment_completion (contact_id, segment_group_id)
  where segment_group_id is not null;

create index if not exists athlete_segment_completion_date_idx
  on public.athlete_segment_completion (contact_id, performance_date desc);

alter table public.athlete_segment_completion enable row level security;

create policy athlete_segment_completion_select on public.athlete_segment_completion
  for select using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_segment_completion.contact_id
        and fm.gym_id in (select public.user_gym_ids ())
    )
  );

create policy athlete_segment_completion_insert on public.athlete_segment_completion
  for insert with check (
    contact_id = public.auth_contact_id ()
    and exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_segment_completion.contact_id
        and fm.role = 'athlete'
        and fm.membership_status = 'active'
    )
  );

create policy athlete_segment_completion_update on public.athlete_segment_completion
  for update using (contact_id = public.auth_contact_id ())
  with check (contact_id = public.auth_contact_id ());

-- Daily completion counts per athlete
create or replace view public.athlete_day_completion_summary as
select
  contact_id,
  performance_date,
  count(*)::int as segments_completed,
  count(*) filter (where segment_group_id is not null)::int as blocks_completed,
  count(*) filter (where programming_id is not null)::int as single_segments_completed
from public.athlete_segment_completion
group by contact_id, performance_date;

-- Movement exposure (catalog + custom labels) for reporting
create or replace view public.programming_movement_exposure as
select
  p.gym_id,
  p.wod_date,
  p.programming_segment,
  p.metcon_format,
  pli.id as programming_line_item_id,
  pli.line_item_kind,
  coalesce(bt.name, pli.movement_label, comp.movement_label) as movement_name,
  coalesce(comp.reps, pli.reps_prescribed) as reps_prescribed
from public.programming p
join public.programming_line_item pli on pli.programming_id = p.id and pli.contact_id is null
left join public.benchmark_type bt on bt.id = pli.benchmark_type_id
left join public.pli_movement_components comp on comp.programming_line_item_id = pli.id
where pli.line_item_kind in ('metcon_movement', 'strength_set', 'complex_set');
