-- Link existing Cody Houchin contact to auth account (codyhouchin@outlook.com)

do $$
declare
  v_email text := 'codyhouchin@outlook.com';
  v_seed_contact_id uuid;
  v_canonical_contact_id uuid;
  v_user_id uuid;
  v_dup_contact_id uuid;
begin
  select c.id into v_seed_contact_id
  from public.contact c
  where c.first_name = 'Cody'
    and c.last_name = 'Houchin'
  order by c.created_at
  limit 1;

  if v_seed_contact_id is null then
    raise exception 'Cody Houchin contact not found';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt('TriadTrain2026!', extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('first_name', 'Cody', 'last_name', 'Houchin'),
      now(),
      now()
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_user_id,
      v_email,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- Auth trigger creates a second contact row; keep seed row's memberships
  select c.id into v_dup_contact_id
  from public.contact c
  where c.user_id = v_user_id
    and c.id <> v_seed_contact_id
  limit 1;

  if v_dup_contact_id is not null then
    update public.fitness_membership
    set contact_id = v_dup_contact_id
    where contact_id = v_seed_contact_id
      and not exists (
        select 1
        from public.fitness_membership fm
        where fm.contact_id = v_dup_contact_id
          and fm.gym_id = fitness_membership.gym_id
          and fm.role = fitness_membership.role
      );

    update public.athlete_subscription
    set contact_id = v_dup_contact_id
    where contact_id = v_seed_contact_id;

    update public.athlete_offering_subscription
    set contact_id = v_dup_contact_id
    where contact_id = v_seed_contact_id;

    update public.athlete_benchmark_summary
    set contact_id = v_dup_contact_id
    where contact_id = v_seed_contact_id;

    update public.athlete_performance
    set contact_id = v_dup_contact_id
    where contact_id = v_seed_contact_id;

    delete from public.fitness_membership where contact_id = v_seed_contact_id;
    delete from public.contact where id = v_seed_contact_id;

    v_canonical_contact_id := v_dup_contact_id;
  else
    v_canonical_contact_id := v_seed_contact_id;

    update public.contact
    set user_id = v_user_id
    where id = v_canonical_contact_id
      and user_id is distinct from v_user_id;
  end if;

  update public.contact
  set
    email = v_email,
    first_name = 'Cody',
    last_name = 'Houchin',
    rx_gender = coalesce(rx_gender, 'male'),
    default_workout_scale = coalesce(default_workout_scale, 'rx'),
    weight_unit = coalesce(weight_unit, 'lb')
  where id = v_canonical_contact_id;

  insert into public.profiles (id, contact_id, display_name)
  values (v_user_id, v_canonical_contact_id, 'Cody Houchin')
  on conflict (id) do update
  set
    contact_id = excluded.contact_id,
    display_name = excluded.display_name;
end;
$$;
