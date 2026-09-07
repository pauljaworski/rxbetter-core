-- Performance track for Triad Training (alongside CrossFit + Hyrox).
-- Grants every active gym athlete access via athlete_track subscriptions,
-- adds the library to Group Class offering, and staff_programmer scope.

alter table public.program_library drop constraint if exists program_library_sport_type_check;
alter table public.program_library add constraint program_library_sport_type_check
  check (sport_type is null or sport_type in (
    'bodybuilding','circuit_training','competitor',
    'crossfit','functional_training','general_fitness',
    'group_classes','hitt','hyrox','performance',
    'specialized_programming','sports_conditioning',
    'strength','weightlifting'
  ));

do $$
declare
  v_gym_id uuid;
  v_perf_lib_id uuid := '10000000-0000-4000-8000-000000000003';
  v_group_offering_id uuid;
  v_contact record;
begin
  select id into v_gym_id
  from public.gym
  where name ilike 'Triad Training'
  order by created_at
  limit 1;

  if v_gym_id is null then
    raise notice 'Triad Training gym not found — skipping Performance track seed';
    return;
  end if;

  insert into public.program_library (id, gym_id, name, description, sport_type, is_active)
  values (
    v_perf_lib_id,
    v_gym_id,
    'Performance',
    'Performance track — strength, conditioning, and competition prep (same programming tools as CrossFit / Hyrox).',
    'performance',
    true
  )
  on conflict (id) do update
  set
    name = excluded.name,
    description = excluded.description,
    sport_type = excluded.sport_type,
    is_active = true,
    gym_id = excluded.gym_id;

  select id into v_group_offering_id
  from public.membership_offering
  where gym_id = v_gym_id
    and name ilike 'Group Class'
  limit 1;

  if v_group_offering_id is not null then
    insert into public.membership_offering_component
      (membership_offering_id, component_type, program_library_id, capability_code)
    select v_group_offering_id, 'program_library', v_perf_lib_id, null
    where not exists (
      select 1
      from public.membership_offering_component
      where membership_offering_id = v_group_offering_id
        and program_library_id = v_perf_lib_id
    );
  end if;

  -- Active athletes at the gym
  for v_contact in
    select distinct fm.contact_id, fm.id as fitness_membership_id
    from public.fitness_membership fm
    where fm.gym_id = v_gym_id
      and fm.membership_status = 'active'
      and fm.role = 'athlete'
  loop
    insert into public.athlete_subscription (
      contact_id, gym_id, fitness_membership_id, program_library_id,
      access_level, status, start_date, end_date, subscription_scope
    )
    select
      v_contact.contact_id, v_gym_id, v_contact.fitness_membership_id, v_perf_lib_id,
      'general', 'active', current_date, null, 'athlete_track'
    where not exists (
      select 1 from public.athlete_subscription s
      where s.contact_id = v_contact.contact_id
        and s.gym_id = v_gym_id
        and s.program_library_id = v_perf_lib_id
        and s.subscription_scope = 'athlete_track'
        and s.status = 'active'
    );
  end loop;

  -- Anyone with another active track at this gym (covers edge memberships)
  for v_contact in
    select distinct s.contact_id, s.fitness_membership_id
    from public.athlete_subscription s
    where s.gym_id = v_gym_id
      and s.subscription_scope = 'athlete_track'
      and s.status = 'active'
  loop
    insert into public.athlete_subscription (
      contact_id, gym_id, fitness_membership_id, program_library_id,
      access_level, status, start_date, end_date, subscription_scope
    )
    select
      v_contact.contact_id, v_gym_id, v_contact.fitness_membership_id, v_perf_lib_id,
      'general', 'active', current_date, null, 'athlete_track'
    where not exists (
      select 1 from public.athlete_subscription x
      where x.contact_id = v_contact.contact_id
        and x.gym_id = v_gym_id
        and x.program_library_id = v_perf_lib_id
        and x.subscription_scope = 'athlete_track'
        and x.status = 'active'
    );
  end loop;

  -- Staff programmers who already have a library scope
  for v_contact in
    select distinct s.contact_id, s.fitness_membership_id
    from public.athlete_subscription s
    where s.gym_id = v_gym_id
      and s.subscription_scope = 'staff_programmer'
      and s.status = 'active'
  loop
    insert into public.athlete_subscription (
      contact_id, gym_id, fitness_membership_id, program_library_id,
      access_level, status, start_date, end_date, subscription_scope
    )
    select
      v_contact.contact_id, v_gym_id, v_contact.fitness_membership_id, v_perf_lib_id,
      'general', 'active', current_date, null, 'staff_programmer'
    where not exists (
      select 1 from public.athlete_subscription x
      where x.contact_id = v_contact.contact_id
        and x.gym_id = v_gym_id
        and x.program_library_id = v_perf_lib_id
        and x.subscription_scope = 'staff_programmer'
        and x.status = 'active'
    );
  end loop;
end $$;
