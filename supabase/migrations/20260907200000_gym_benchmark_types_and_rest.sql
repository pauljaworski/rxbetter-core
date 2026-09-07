-- Gym-scoped custom movements + rest between sets/movements
-- Platform-wide catalog rows keep gym_id NULL (admin-only writes).
-- Gym programmers may insert/update rows for their own gym only.

alter table public.benchmark_type
  add column if not exists gym_id uuid references public.gym (id) on delete cascade;

comment on column public.benchmark_type.gym_id is
  'NULL = platform catalog (all gyms). Set = gym-owned custom movement (visible only to that gym).';

create unique index if not exists benchmark_type_global_name_uidx
  on public.benchmark_type (lower(name))
  where gym_id is null;

create unique index if not exists benchmark_type_gym_name_uidx
  on public.benchmark_type (gym_id, lower(name))
  where gym_id is not null;

create index if not exists benchmark_type_gym_id_idx
  on public.benchmark_type (gym_id)
  where gym_id is not null;

-- Rest after a set / between multi-movement sets (seconds).
alter table public.programming_line_item
  add column if not exists rest_sec integer
    check (rest_sec is null or (rest_sec >= 0 and rest_sec <= 7200));

comment on column public.programming_line_item.rest_sec is
  'Optional rest after this set/line (seconds). For complex_set, typically rest between sets.';

comment on column public.programming_line_item.movement_components is
  'JSON array of { benchmark_type_id, reps, unit?, label, rest_after_sec? } for complex_set rows.';

-- Narrow global catalog visibility: everyone sees platform rows; gym members see their customs.
drop policy if exists benchmark_type_select on public.benchmark_type;
create policy benchmark_type_select on public.benchmark_type
  for select to authenticated using (
    gym_id is null
    or gym_id in (select public.user_gym_ids ())
  );

-- Programmers/admins may create gym-scoped movements (not platform-wide).
drop policy if exists benchmark_type_insert_gym on public.benchmark_type;
create policy benchmark_type_insert_gym on public.benchmark_type
  for insert to authenticated
  with check (
    gym_id is not null
    and gym_id in (select public.user_gym_ids ())
    and (
      public.is_gym_admin_scoped (gym_id)
      or (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_gym_staff_entitlement (gym_id, 'staff_programmer')
      )
    )
  );

drop policy if exists benchmark_type_update_gym on public.benchmark_type;
create policy benchmark_type_update_gym on public.benchmark_type
  for update to authenticated
  using (
    gym_id is not null
    and gym_id in (select public.user_gym_ids ())
    and (
      public.is_gym_admin_scoped (gym_id)
      or (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_gym_staff_entitlement (gym_id, 'staff_programmer')
      )
    )
  )
  with check (
    gym_id is not null
    and gym_id in (select public.user_gym_ids ())
    and (
      public.is_gym_admin_scoped (gym_id)
      or (
        public.has_active_fm_role (gym_id, 'programmer')
        and public.has_gym_staff_entitlement (gym_id, 'staff_programmer')
      )
    )
  );

-- Allow staff to seed 1RM definitions for gym customs they just created.
drop policy if exists benchmark_definition_insert_gym on public.benchmark_definition;
create policy benchmark_definition_insert_gym on public.benchmark_definition
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.benchmark_type bt
      where bt.id = benchmark_type_id
        and bt.gym_id is not null
        and bt.gym_id in (select public.user_gym_ids ())
        and (
          public.is_gym_admin_scoped (bt.gym_id)
          or (
            public.has_active_fm_role (bt.gym_id, 'programmer')
            and public.has_gym_staff_entitlement (bt.gym_id, 'staff_programmer')
          )
        )
    )
  );

-- Upsert a gym-scoped movement and ensure common rep-max definitions exist.
create or replace function public.ensure_gym_benchmark_type (
  p_gym_id uuid,
  p_name text,
  p_stimulus text default 'strength',
  p_sub_stimulus text default null,
  p_purpose_variation text default 'gym_custom'
)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_name text := trim(p_name);
  v_stimulus text := coalesce(nullif(trim(p_stimulus), ''), 'strength');
  v_id uuid;
begin
  if v_name is null or length(v_name) < 1 then
    raise exception 'Movement name is required';
  end if;

  if p_gym_id is null then
    raise exception 'gym_id is required for gym movements';
  end if;

  if not (
    public.is_gym_admin_scoped (p_gym_id)
    or (
      public.has_active_fm_role (p_gym_id, 'programmer')
      and public.has_gym_staff_entitlement (p_gym_id, 'staff_programmer')
    )
  ) then
    raise exception 'Not allowed to create gym movements for this gym';
  end if;

  if v_stimulus not in ('strength', 'metcon', 'skill') then
    v_stimulus := 'strength';
  end if;

  select bt.id into v_id
  from public.benchmark_type bt
  where bt.gym_id = p_gym_id
    and lower(bt.name) = lower(v_name)
  limit 1;

  if v_id is null then
    insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation, gym_id)
    values (
      v_name,
      v_stimulus,
      p_sub_stimulus,
      coalesce(nullif(trim(p_purpose_variation), ''), 'gym_custom'),
      p_gym_id
    )
    returning id into v_id;
  end if;

  insert into public.benchmark_definition (benchmark_type_id, rep_count)
  select v_id, r.rep_count
  from (values (1), (2), (3), (5), (10)) as r(rep_count)
  where not exists (
    select 1
    from public.benchmark_definition bd
    where bd.benchmark_type_id = v_id
      and bd.rep_count = r.rep_count
  );

  return v_id;
end;
$$;

revoke all on function public.ensure_gym_benchmark_type (uuid, text, text, text, text) from public;
grant execute on function public.ensure_gym_benchmark_type (uuid, text, text, text, text) to authenticated;
