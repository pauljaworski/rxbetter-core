-- =============================================================================
-- Athlete profile preferences + gym leaderboard levels + social (likes/comments)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- contact: avatar, default scale, weight unit, timezone
-- ---------------------------------------------------------------------------
alter table public.contact
  add column if not exists avatar_url text,
  add column if not exists default_workout_scale public.workout_scale,
  add column if not exists weight_unit text not null default 'lb',
  add column if not exists timezone text;

alter table public.contact
  drop constraint if exists contact_weight_unit_check;

alter table public.contact
  add constraint contact_weight_unit_check
  check (weight_unit in ('lb', 'kg'));

comment on column public.contact.avatar_url is 'Public avatar image URL for leaderboard and profile.';
comment on column public.contact.default_workout_scale is 'Default Rx level when logging WOD scores.';
comment on column public.contact.weight_unit is 'Preferred display unit for loads (lb or kg). Stored PRs remain in lb.';
comment on column public.contact.timezone is 'IANA timezone for scheduling display (e.g. America/New_York).';

-- ---------------------------------------------------------------------------
-- gym: configurable leaderboard level tabs
-- ---------------------------------------------------------------------------
alter table public.gym
  add column if not exists leaderboard_levels jsonb not null default '["rx_plus","rx","fx","scaled"]'::jsonb;

comment on column public.gym.leaderboard_levels is
  'Ordered workout_scale values shown on the gym leaderboard (subset of rx_plus, rx, fx, scaled).';

-- ---------------------------------------------------------------------------
-- profiles: allow gym peers to read display_name for leaderboard
-- ---------------------------------------------------------------------------
create policy profiles_select_gym_peers on public.profiles
  for select using (
    contact_id in (
      select fm.contact_id
      from public.fitness_membership fm
      where fm.gym_id in (select public.user_gym_ids ())
        and fm.membership_status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- leaderboard_like
-- ---------------------------------------------------------------------------
create table if not exists public.leaderboard_like (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gym (id) on delete cascade,
  performance_id uuid not null references public.athlete_performance (id) on delete cascade,
  contact_id uuid not null references public.contact (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (performance_id, contact_id)
);

create index if not exists leaderboard_like_performance_idx
  on public.leaderboard_like (performance_id);

create index if not exists leaderboard_like_gym_idx
  on public.leaderboard_like (gym_id);

alter table public.leaderboard_like enable row level security;

create policy leaderboard_like_select on public.leaderboard_like
  for select using (gym_id in (select public.user_gym_ids ()));

create policy leaderboard_like_insert on public.leaderboard_like
  for insert with check (
    contact_id = public.auth_contact_id ()
    and gym_id in (select public.user_gym_ids ())
  );

create policy leaderboard_like_delete on public.leaderboard_like
  for delete using (contact_id = public.auth_contact_id ());

-- ---------------------------------------------------------------------------
-- leaderboard_comment
-- ---------------------------------------------------------------------------
create table if not exists public.leaderboard_comment (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gym (id) on delete cascade,
  performance_id uuid not null references public.athlete_performance (id) on delete cascade,
  contact_id uuid not null references public.contact (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_comment_performance_idx
  on public.leaderboard_comment (performance_id, created_at);

create index if not exists leaderboard_comment_gym_idx
  on public.leaderboard_comment (gym_id);

alter table public.leaderboard_comment enable row level security;

create policy leaderboard_comment_select on public.leaderboard_comment
  for select using (gym_id in (select public.user_gym_ids ()));

create policy leaderboard_comment_insert on public.leaderboard_comment
  for insert with check (
    contact_id = public.auth_contact_id ()
    and gym_id in (select public.user_gym_ids ())
  );

create policy leaderboard_comment_delete on public.leaderboard_comment
  for delete using (contact_id = public.auth_contact_id ());

create policy leaderboard_comment_update on public.leaderboard_comment
  for update using (contact_id = public.auth_contact_id ())
  with check (contact_id = public.auth_contact_id ());
