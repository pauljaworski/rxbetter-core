-- Athletes only see programming once published_at is set.

alter table public.programming
  add column if not exists published_at timestamptz;

comment on column public.programming.published_at is
  'When set, programming is visible to athletes for that gym/date. Null = draft (staff only).';

create index if not exists programming_gym_date_published_idx
  on public.programming (gym_id, wod_date, published_at);
