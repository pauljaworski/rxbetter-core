-- One score row per athlete natural key (class PLI / segment / dated group).
-- Prevents double-submit races from forking the performance ledger.

-- ---------------------------------------------------------------------------
-- 1. Deduplicate existing rows (keep newest; reassign social FKs when possible)
-- ---------------------------------------------------------------------------

-- Line-item scores: (contact_id, programming_line_item_id)
with ranked as (
  select
    id,
    contact_id,
    programming_line_item_id,
    row_number() over (
      partition by contact_id, programming_line_item_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.athlete_performance
  where programming_line_item_id is not null
),
keepers as (
  select id, contact_id, programming_line_item_id
  from ranked
  where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keeper_id
  from ranked r
  join keepers k
    on k.contact_id = r.contact_id
   and k.programming_line_item_id = r.programming_line_item_id
  where r.rn > 1
)
update public.leaderboard_like ll
set performance_id = d.keeper_id
from dupes d
where ll.performance_id = d.dupe_id
  and not exists (
    select 1
    from public.leaderboard_like existing
    where existing.performance_id = d.keeper_id
      and existing.contact_id = ll.contact_id
  );

with ranked as (
  select
    id,
    contact_id,
    programming_line_item_id,
    row_number() over (
      partition by contact_id, programming_line_item_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.athlete_performance
  where programming_line_item_id is not null
),
keepers as (
  select id, contact_id, programming_line_item_id
  from ranked
  where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keeper_id
  from ranked r
  join keepers k
    on k.contact_id = r.contact_id
   and k.programming_line_item_id = r.programming_line_item_id
  where r.rn > 1
)
update public.leaderboard_comment lc
set performance_id = d.keeper_id
from dupes d
where lc.performance_id = d.dupe_id;

delete from public.athlete_performance ap
using (
  select id
  from (
    select
      id,
      row_number() over (
        partition by contact_id, programming_line_item_id
        order by updated_at desc nulls last, created_at desc nulls last, id desc
      ) as rn
    from public.athlete_performance
    where programming_line_item_id is not null
  ) ranked
  where rn > 1
) dupes
where ap.id = dupes.id;

-- Segment scores (no PLI, no group): (contact_id, programming_id)
with ranked as (
  select
    id,
    contact_id,
    programming_id,
    row_number() over (
      partition by contact_id, programming_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.athlete_performance
  where programming_id is not null
    and programming_line_item_id is null
    and segment_group_id is null
),
keepers as (
  select id, contact_id, programming_id
  from ranked
  where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keeper_id
  from ranked r
  join keepers k
    on k.contact_id = r.contact_id
   and k.programming_id = r.programming_id
  where r.rn > 1
)
update public.leaderboard_like ll
set performance_id = d.keeper_id
from dupes d
where ll.performance_id = d.dupe_id
  and not exists (
    select 1
    from public.leaderboard_like existing
    where existing.performance_id = d.keeper_id
      and existing.contact_id = ll.contact_id
  );

with ranked as (
  select
    id,
    contact_id,
    programming_id,
    row_number() over (
      partition by contact_id, programming_id
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.athlete_performance
  where programming_id is not null
    and programming_line_item_id is null
    and segment_group_id is null
),
keepers as (
  select id, contact_id, programming_id
  from ranked
  where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keeper_id
  from ranked r
  join keepers k
    on k.contact_id = r.contact_id
   and k.programming_id = r.programming_id
  where r.rn > 1
)
update public.leaderboard_comment lc
set performance_id = d.keeper_id
from dupes d
where lc.performance_id = d.dupe_id;

delete from public.athlete_performance ap
using (
  select id
  from (
    select
      id,
      row_number() over (
        partition by contact_id, programming_id
        order by updated_at desc nulls last, created_at desc nulls last, id desc
      ) as rn
    from public.athlete_performance
    where programming_id is not null
      and programming_line_item_id is null
      and segment_group_id is null
  ) ranked
  where rn > 1
) dupes
where ap.id = dupes.id;

-- Group scores: (contact_id, segment_group_id, performance_date)
with ranked as (
  select
    id,
    contact_id,
    segment_group_id,
    performance_date,
    row_number() over (
      partition by contact_id, segment_group_id, performance_date
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.athlete_performance
  where segment_group_id is not null
    and performance_date is not null
),
keepers as (
  select id, contact_id, segment_group_id, performance_date
  from ranked
  where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keeper_id
  from ranked r
  join keepers k
    on k.contact_id = r.contact_id
   and k.segment_group_id = r.segment_group_id
   and k.performance_date = r.performance_date
  where r.rn > 1
)
update public.leaderboard_like ll
set performance_id = d.keeper_id
from dupes d
where ll.performance_id = d.dupe_id
  and not exists (
    select 1
    from public.leaderboard_like existing
    where existing.performance_id = d.keeper_id
      and existing.contact_id = ll.contact_id
  );

with ranked as (
  select
    id,
    contact_id,
    segment_group_id,
    performance_date,
    row_number() over (
      partition by contact_id, segment_group_id, performance_date
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.athlete_performance
  where segment_group_id is not null
    and performance_date is not null
),
keepers as (
  select id, contact_id, segment_group_id, performance_date
  from ranked
  where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keeper_id
  from ranked r
  join keepers k
    on k.contact_id = r.contact_id
   and k.segment_group_id = r.segment_group_id
   and k.performance_date = r.performance_date
  where r.rn > 1
)
update public.leaderboard_comment lc
set performance_id = d.keeper_id
from dupes d
where lc.performance_id = d.dupe_id;

delete from public.athlete_performance ap
using (
  select id
  from (
    select
      id,
      row_number() over (
        partition by contact_id, segment_group_id, performance_date
        order by updated_at desc nulls last, created_at desc nulls last, id desc
      ) as rn
    from public.athlete_performance
    where segment_group_id is not null
      and performance_date is not null
  ) ranked
  where rn > 1
) dupes
where ap.id = dupes.id;

-- ---------------------------------------------------------------------------
-- 2. Enforce uniqueness going forward
-- ---------------------------------------------------------------------------

create unique index if not exists athlete_performance_contact_pli_uidx
  on public.athlete_performance (contact_id, programming_line_item_id)
  where programming_line_item_id is not null;

create unique index if not exists athlete_performance_contact_segment_uidx
  on public.athlete_performance (contact_id, programming_id)
  where programming_id is not null
    and programming_line_item_id is null
    and segment_group_id is null;

create unique index if not exists athlete_performance_contact_group_date_uidx
  on public.athlete_performance (contact_id, segment_group_id, performance_date)
  where segment_group_id is not null
    and performance_date is not null;

comment on index public.athlete_performance_contact_pli_uidx is
  'One class/personal line-item score per athlete; blocks double-submit ledger forks.';
comment on index public.athlete_performance_contact_segment_uidx is
  'One segment-level score per athlete per programming row (metcon without PLI).';
comment on index public.athlete_performance_contact_group_date_uidx is
  'One multi-part group score per athlete per group per day.';
