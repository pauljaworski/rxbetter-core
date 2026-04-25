-- ============================================================================
-- RxBetter — definitive core schema
-- Translated from Salesforce POC (paulagentforce@abc.com) custom objects.
-- Migration order follows FK dependency graph.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Utility: auto-update updated_at on every UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at ()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. gym  (SF: Account + Subscription_Status__c / Subscription_Plan__c)
-- ---------------------------------------------------------------------------
create table public.gym (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  subscription_status text     check (subscription_status in
                                 ('trial','active','suspended','churned')),
  subscription_plan   text     check (subscription_plan in
                                 ('starter','pro','elite')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger gym_set_updated_at
  before update on public.gym
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. contact  (SF: Contact — people: athletes, coaches, owners)
-- ---------------------------------------------------------------------------
create table public.contact (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        unique references auth.users(id) on delete set null,
  first_name       text,
  last_name        text,
  email            text,
  phone            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index contact_user_id_idx on public.contact(user_id);

create trigger contact_set_updated_at
  before update on public.contact
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. profiles  (auth bridge: auth.users -> contact)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  contact_id       uuid        not null references public.contact(id) on delete restrict,
  display_name     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. gym_onboarding_request  (SF: Gym_Onboarding_Request__c)
-- ---------------------------------------------------------------------------
create table public.gym_onboarding_request (
  id                  uuid        primary key default gen_random_uuid(),
  gym_name            text,
  owner_first_name    text,
  owner_last_name     text,
  owner_email         text,
  owner_phone         text,
  gym_phone           text,
  gym_website         text,
  requested_tracks    text[],
  subscription_plan   text        check (subscription_plan in
                                    ('starter','pro','elite')),
  status              text        check (status in
                                    ('submitted','processing','completed',
                                     'needs_review','failed'))
                                  default 'submitted',
  error_message       text,
  created_account_id  uuid        references public.gym(id)    on delete set null,
  created_contact_id  uuid        references public.contact(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger gym_onboarding_request_set_updated_at
  before update on public.gym_onboarding_request
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. program_library  (SF: Program_Library__c, MD -> Account)
-- ---------------------------------------------------------------------------
create table public.program_library (
  id                    uuid        primary key default gen_random_uuid(),
  gym_id                uuid        not null references public.gym(id) on delete cascade,
  name                  text        not null,
  description           text,
  sport_type            text        check (sport_type in (
                                      'bodybuilding','circuit_training','competitor',
                                      'crossfit','functional_training','general_fitness',
                                      'group_classes','hitt','hyrox',
                                      'specialized_programming','sports_conditioning',
                                      'strength','weightlifting')),
  is_active             boolean     not null default true,
  is_public             boolean     not null default false,
  is_platform_template  boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index program_library_gym_id_idx on public.program_library(gym_id);

create trigger program_library_set_updated_at
  before update on public.program_library
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. fitness_membership  (SF: Fitness_Membership__c, MD -> Contact)
--    Junction: person <-> gym with a role.
-- ---------------------------------------------------------------------------
create table public.fitness_membership (
  id                uuid        primary key default gen_random_uuid(),
  contact_id        uuid        not null references public.contact(id) on delete cascade,
  gym_id            uuid        not null references public.gym(id)     on delete cascade,
  role              text        check (role in
                                  ('athlete','coach','head_coach','admin','owner')),
  membership_status text        check (membership_status in ('active','inactive'))
                                default 'active',
  join_date         date,
  end_date          date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (contact_id, gym_id, role)
);

create index fitness_membership_contact_idx on public.fitness_membership(contact_id);
create index fitness_membership_gym_idx     on public.fitness_membership(gym_id);

create trigger fitness_membership_set_updated_at
  before update on public.fitness_membership
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. athlete_subscription  (SF: Athlete_Subscription__c, MD -> Contact)
--    Entitlement to a program library within a gym.
-- ---------------------------------------------------------------------------
create table public.athlete_subscription (
  id                    uuid        primary key default gen_random_uuid(),
  contact_id            uuid        not null references public.contact(id) on delete cascade,
  gym_id                uuid        not null references public.gym(id)     on delete cascade,
  fitness_membership_id uuid        references public.fitness_membership(id) on delete set null,
  program_library_id    uuid        references public.program_library(id)   on delete set null,
  access_level          text        check (access_level in ('general','individualized'))
                                    default 'general',
  status                text        check (status in
                                      ('active','trial','paused','cancelled'))
                                    default 'active',
  start_date            date,
  end_date              date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index athlete_subscription_contact_idx on public.athlete_subscription(contact_id);
create index athlete_subscription_gym_idx     on public.athlete_subscription(gym_id);

create trigger athlete_subscription_set_updated_at
  before update on public.athlete_subscription
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. benchmark_type  (SF: Programming_Type__c, labeled "Benchmark Type")
--    Global reference data: movements and metcons.
-- ---------------------------------------------------------------------------
create table public.benchmark_type (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  stimulus          text        check (stimulus in ('strength','metcon','skill')),
  sub_stimulus      text        check (sub_stimulus in
                                  ('clean','combined','jerk','press',
                                   'pull','snatch','squat')),
  purpose_variation text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger benchmark_type_set_updated_at
  before update on public.benchmark_type
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. benchmark_definition  (SF: Benchmark_Definition__c, MD -> Programming_Type__c)
--    Rep scheme for a benchmark type, e.g. "Back Squat 1RM".
-- ---------------------------------------------------------------------------
create table public.benchmark_definition (
  id                uuid        primary key default gen_random_uuid(),
  benchmark_type_id uuid        not null references public.benchmark_type(id) on delete cascade,
  rep_count         smallint    not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (benchmark_type_id, rep_count)
);

create trigger benchmark_definition_set_updated_at
  before update on public.benchmark_definition
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. programming  (SF: Programming__c)
--     A gym's prescribed WOD / session for a given date.
-- ---------------------------------------------------------------------------
create table public.programming (
  id                   uuid        primary key default gen_random_uuid(),
  gym_id               uuid        not null references public.gym(id) on delete restrict,
  program_library_id   uuid        references public.program_library(id) on delete set null,
  name                 text,
  wod_date             date        not null,
  programming_segment  text        check (programming_segment in
                                     ('weightlifting','metcon','skill','bodyweight')),
  metcon_format        text        check (metcon_format in
                                     ('amrap','chipper','emom','for_time')),
  display_order        smallint,
  description          text,
  coaches_notes        text,
  athlete_notes        text,
  is_completed         boolean     not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index programming_gym_date_idx on public.programming(gym_id, wod_date desc);

create trigger programming_set_updated_at
  before update on public.programming
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. programming_line_item  (SF: Programming_Line_Item__c, MD -> Programming__c)
--     Sets / reps / movements an athlete should complete.
-- ---------------------------------------------------------------------------
create table public.programming_line_item (
  id                      uuid        primary key default gen_random_uuid(),
  programming_id          uuid        not null references public.programming(id) on delete cascade,
  benchmark_type_id       uuid        references public.benchmark_type(id)       on delete set null,
  benchmark_definition_id uuid        references public.benchmark_definition(id) on delete set null,
  contact_id              uuid        references public.contact(id)              on delete set null,
  sequence_number         smallint,
  reps_prescribed         numeric,
  prescribed_weight       numeric,
  prescribed_percentage   numeric,
  intensity_percentage    numeric,
  target_weight           numeric,
  actual_weight_lifted    numeric,
  athlete_current_pr      numeric,
  prescribed_score        text,
  status                  text        check (status in ('pending','completed','failed'))
                                      default 'pending',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index pli_programming_idx on public.programming_line_item(programming_id);

create trigger programming_line_item_set_updated_at
  before update on public.programming_line_item
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. athlete_performance  (SF: Athlete_Performance__c, MD -> Contact)
--     Historical record of completed line items.
-- ---------------------------------------------------------------------------
create table public.athlete_performance (
  id                        uuid        primary key default gen_random_uuid(),
  contact_id                uuid        not null references public.contact(id) on delete cascade,
  programming_id            uuid        references public.programming(id)           on delete set null,
  programming_line_item_id  uuid        references public.programming_line_item(id) on delete set null,
  benchmark_type_id         uuid        references public.benchmark_type(id)        on delete set null,
  benchmark_definition_id   uuid        references public.benchmark_definition(id)  on delete set null,
  performance_date          date,
  status                    text        check (status in ('pending','completed','failed')),
  score                     text,
  result_value              numeric,
  reps_prescribed           numeric,
  weight_lifted             numeric,
  rpe                       numeric,
  prescribed_percentage     numeric,
  is_pr                     boolean     not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index athlete_performance_contact_idx      on public.athlete_performance(contact_id);
create index athlete_performance_programming_idx  on public.athlete_performance(programming_id);
create index athlete_performance_benchmark_def_idx on public.athlete_performance(benchmark_definition_id);

create trigger athlete_performance_set_updated_at
  before update on public.athlete_performance
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 13. athlete_benchmark_summary  (SF: Athlete_Benchmark_Summary__c)
--     Created when a benchmark PR is hit.
-- ---------------------------------------------------------------------------
create table public.athlete_benchmark_summary (
  id                      uuid        primary key default gen_random_uuid(),
  contact_id              uuid        not null references public.contact(id)              on delete cascade,
  benchmark_definition_id uuid        not null references public.benchmark_definition(id) on delete cascade,
  current_pr_weight       numeric,
  date_pr_achieved        date,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (contact_id, benchmark_definition_id)
);

create index athlete_benchmark_summary_contact_idx on public.athlete_benchmark_summary(contact_id);

create trigger athlete_benchmark_summary_set_updated_at
  before update on public.athlete_benchmark_summary
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- VIEWS — formula / rollup equivalents
-- ============================================================================

-- SF formula: Benchmark_Definition__c.Benchmark_Name__c =
--   Programming_Type__r.Name + ' ' + Text(Rep_Count__c) + 'RM'
create or replace view public.benchmark_definition_display as
select
  bd.id,
  bd.benchmark_type_id,
  bd.rep_count,
  bt.name || ' ' || bd.rep_count::text || 'RM' as benchmark_name,
  bt.name        as benchmark_type_name,
  bt.stimulus,
  bt.sub_stimulus,
  bd.created_at,
  bd.updated_at
from public.benchmark_definition bd
join public.benchmark_type bt on bt.id = bd.benchmark_type_id;

-- SF rollups: Programming__c.Total_Sets__c (COUNT all PLIs),
--   Completed_Sets__c (COUNT where status in Completed/Failed),
--   Completed__c formula (Total = Completed).
create or replace view public.programming_with_counts as
select
  p.*,
  coalesce(agg.total_sets, 0)     as total_sets,
  coalesce(agg.completed_sets, 0) as completed_sets,
  case
    when coalesce(agg.total_sets, 0) > 0
     and coalesce(agg.total_sets, 0) = coalesce(agg.completed_sets, 0)
    then true
    else false
  end as all_sets_completed
from public.programming p
left join lateral (
  select
    count(*)                                          as total_sets,
    count(*) filter (where pli.status in ('completed','failed')) as completed_sets
  from public.programming_line_item pli
  where pli.programming_id = p.id
) agg on true;

-- ============================================================================
-- RLS — gym-scoped isolation via fitness_membership
-- ============================================================================

-- Helper: gym ids the current auth.uid() belongs to via fitness_membership.
create or replace function public.user_gym_ids()
  returns setof uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select fm.gym_id
  from public.fitness_membership fm
  join public.contact c on c.id = fm.contact_id
  where c.user_id = auth.uid()
    and fm.membership_status = 'active';
$$;

-- Helper: contact ids the current auth.uid() owns.
create or replace function public.user_contact_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select c.id
  from public.contact c
  where c.user_id = auth.uid()
  limit 1;
$$;

-- ---- Enable RLS on all tables ----
alter table public.gym                      enable row level security;
alter table public.contact                  enable row level security;
alter table public.profiles                 enable row level security;
alter table public.gym_onboarding_request   enable row level security;
alter table public.program_library          enable row level security;
alter table public.fitness_membership       enable row level security;
alter table public.athlete_subscription     enable row level security;
alter table public.benchmark_type           enable row level security;
alter table public.benchmark_definition     enable row level security;
alter table public.programming              enable row level security;
alter table public.programming_line_item    enable row level security;
alter table public.athlete_performance      enable row level security;
alter table public.athlete_benchmark_summary enable row level security;

-- ---- gym ----
create policy gym_select on public.gym
  for select using (id in (select public.user_gym_ids()));
create policy gym_insert on public.gym
  for insert to authenticated with check (true);
create policy gym_update on public.gym
  for update using (id in (select public.user_gym_ids()));

-- ---- contact ----
create policy contact_select_own on public.contact
  for select using (user_id = auth.uid());
create policy contact_select_gym on public.contact
  for select using (
    id in (
      select fm2.contact_id
      from public.fitness_membership fm2
      where fm2.gym_id in (select public.user_gym_ids())
    )
  );
create policy contact_insert on public.contact
  for insert to authenticated with check (true);
create policy contact_update_own on public.contact
  for update using (user_id = auth.uid());

-- ---- profiles ----
create policy profiles_select on public.profiles
  for select using (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

-- ---- gym_onboarding_request ----
create policy onboarding_insert on public.gym_onboarding_request
  for insert to authenticated with check (true);
create policy onboarding_select on public.gym_onboarding_request
  for select using (
    created_contact_id = (select public.user_contact_id())
    or created_account_id in (select public.user_gym_ids())
  );

-- ---- program_library ----
create policy program_library_select on public.program_library
  for select using (gym_id in (select public.user_gym_ids()));
create policy program_library_insert on public.program_library
  for insert with check (gym_id in (select public.user_gym_ids()));
create policy program_library_update on public.program_library
  for update using (gym_id in (select public.user_gym_ids()));

-- ---- fitness_membership ----
create policy fitness_membership_select on public.fitness_membership
  for select using (gym_id in (select public.user_gym_ids()));
create policy fitness_membership_insert on public.fitness_membership
  for insert with check (gym_id in (select public.user_gym_ids()));
create policy fitness_membership_update on public.fitness_membership
  for update using (gym_id in (select public.user_gym_ids()));

-- ---- athlete_subscription ----
create policy athlete_subscription_select on public.athlete_subscription
  for select using (gym_id in (select public.user_gym_ids()));
create policy athlete_subscription_insert on public.athlete_subscription
  for insert with check (gym_id in (select public.user_gym_ids()));
create policy athlete_subscription_update on public.athlete_subscription
  for update using (gym_id in (select public.user_gym_ids()));

-- ---- benchmark_type (global reference — read open, write restricted) ----
create policy benchmark_type_select on public.benchmark_type
  for select to authenticated using (true);

-- ---- benchmark_definition (global reference — read open) ----
create policy benchmark_definition_select on public.benchmark_definition
  for select to authenticated using (true);

-- ---- programming ----
create policy programming_select on public.programming
  for select using (gym_id in (select public.user_gym_ids()));
create policy programming_insert on public.programming
  for insert with check (gym_id in (select public.user_gym_ids()));
create policy programming_update on public.programming
  for update using (gym_id in (select public.user_gym_ids()));

-- ---- programming_line_item (resolve gym via parent programming) ----
create policy pli_select on public.programming_line_item
  for select using (
    exists (
      select 1 from public.programming p
      where p.id = programming_id
        and p.gym_id in (select public.user_gym_ids())
    )
  );
create policy pli_insert on public.programming_line_item
  for insert with check (
    exists (
      select 1 from public.programming p
      where p.id = programming_id
        and p.gym_id in (select public.user_gym_ids())
    )
  );
create policy pli_update on public.programming_line_item
  for update using (
    exists (
      select 1 from public.programming p
      where p.id = programming_id
        and p.gym_id in (select public.user_gym_ids())
    )
  );

-- ---- athlete_performance (resolve gym via contact -> fitness_membership) ----
create policy athlete_performance_select on public.athlete_performance
  for select using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and fm.gym_id in (select public.user_gym_ids())
    )
  );
create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and fm.gym_id in (select public.user_gym_ids())
    )
  );
create policy athlete_performance_update on public.athlete_performance
  for update using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and fm.gym_id in (select public.user_gym_ids())
    )
  );

-- ---- athlete_benchmark_summary (same pattern as performance) ----
create policy athlete_benchmark_summary_select on public.athlete_benchmark_summary
  for select using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and fm.gym_id in (select public.user_gym_ids())
    )
  );
create policy athlete_benchmark_summary_insert on public.athlete_benchmark_summary
  for insert with check (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and fm.gym_id in (select public.user_gym_ids())
    )
  );
create policy athlete_benchmark_summary_update on public.athlete_benchmark_summary
  for update using (
    exists (
      select 1 from public.fitness_membership fm
      where fm.contact_id = athlete_benchmark_summary.contact_id
        and fm.gym_id in (select public.user_gym_ids())
    )
  );
