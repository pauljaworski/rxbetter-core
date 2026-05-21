-- WOD intake staging: plain-text parse & confirm before programming commit

create table public.programming_intake_stage (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gym (id) on delete cascade,
  coach_contact_id uuid not null references public.contact (id) on delete restrict,
  program_library_id uuid not null references public.program_library (id) on delete restrict,
  wod_date date not null,
  raw_text text not null,
  parsed_payload jsonb not null default '{}'::jsonb,
  parser_mode text not null default 'regex'
    check (parser_mode in ('regex', 'llm', 'manual')),
  contains_errors boolean not null default false,
  correction_applied boolean not null default false,
  latency_ms integer,
  token_count integer,
  status text not null default 'staged'
    check (status in ('staged', 'committed', 'rejected')),
  committed_programming_id uuid references public.programming (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.programming_intake_stage is
  'Staging for coach/programmer plain-text WOD intake before commit to programming.';

create index programming_intake_stage_gym_date_idx
  on public.programming_intake_stage (gym_id, wod_date desc, created_at desc);

create trigger programming_intake_stage_set_updated_at
  before update on public.programming_intake_stage
  for each row execute procedure public.set_updated_at();

alter table public.programming_intake_stage enable row level security;

-- Read: any member of the gym
create policy programming_intake_stage_select on public.programming_intake_stage
  for select using (gym_id in (select public.user_gym_ids ()));

-- Write: programmer + library scope, or admin gym-wide (mirrors programming_insert)
create policy programming_intake_stage_insert on public.programming_intake_stage
  for insert with check (
    coach_contact_id = public.auth_contact_id ()
    and gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and (
          public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
          or public.has_gym_staff_entitlement (gym_id, 'staff_admin')
        )
      )
    )
  );

create policy programming_intake_stage_update on public.programming_intake_stage
  for update using (
    gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and (
          public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
          or public.has_gym_staff_entitlement (gym_id, 'staff_admin')
        )
      )
    )
  )
  with check (
    gym_id in (select public.user_gym_ids ())
    and (
      (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role (gym_id, 'admin')
        and (
          public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
          or public.has_gym_staff_entitlement (gym_id, 'staff_admin')
        )
      )
    )
  );
