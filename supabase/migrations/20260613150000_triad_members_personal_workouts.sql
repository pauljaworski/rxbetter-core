-- =============================================================================
-- Triad Training POC members + personal workout access for all gym members
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Personal workouts: any active gym member (not only athlete role)
-- ---------------------------------------------------------------------------
drop policy if exists programming_insert_athlete_custom on public.programming;

create policy programming_insert_athlete_custom on public.programming
  for insert with check (
    created_by_contact_id = public.auth_contact_id ()
    and source = 'athlete_custom'
    and (
      gym_id is null
      or exists (
        select 1
        from public.fitness_membership fm
        where fm.contact_id = public.auth_contact_id ()
          and fm.gym_id = programming.gym_id
          and fm.membership_status = 'active'
      )
    )
    and program_library_id is null
  );

create policy programming_delete_athlete_custom on public.programming
  for delete using (
    source = 'athlete_custom'
    and created_by_contact_id = public.auth_contact_id ()
  );

create policy pli_delete_athlete_custom on public.programming_line_item
  for delete using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.source = 'athlete_custom'
        and p.created_by_contact_id = public.auth_contact_id ()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Seed helper: provision Triad member with both tracks for one year
-- ---------------------------------------------------------------------------
create or replace function public.seed_triad_member (
  p_email text,
  p_first_name text,
  p_last_name text,
  p_rx_gender text,
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_gym_id uuid;
  v_cf_lib uuid;
  v_hyrox_lib uuid;
  v_contact_id uuid;
  v_user_id uuid;
  v_fm_id uuid;
  v_end_date date := (current_date + interval '1 year')::date;
  v_lib_id uuid;
  v_offering_id uuid;
  v_term_id uuid;
  v_offering_sub_id uuid;
begin
  select g.id into v_gym_id
  from public.gym g
  where g.name ilike '%triad%training%'
  limit 1;

  if v_gym_id is null then
    raise exception 'seed_triad_member: Triad Training gym not found';
  end if;

  select pl.id into v_cf_lib
  from public.program_library pl
  where pl.gym_id = v_gym_id
    and pl.name ilike '%crossfit%'
  limit 1;

  select pl.id into v_hyrox_lib
  from public.program_library pl
  where pl.gym_id = v_gym_id
    and pl.name ilike '%hyrox%'
  limit 1;

  if v_cf_lib is null or v_hyrox_lib is null then
    raise exception 'seed_triad_member: CrossFit and/or Hyrox program libraries not found for Triad';
  end if;

  -- Resolve contact: existing auth user, existing contact by email, or create auth user
  if p_email is not null then
    select u.id into v_user_id
    from auth.users u
    where lower(u.email) = lower(p_email)
    limit 1;

    if v_user_id is not null then
      select c.id into v_contact_id
      from public.contact c
      where c.user_id = v_user_id
      limit 1;
    end if;

    if v_contact_id is null then
      select c.id into v_contact_id
      from public.contact c
      where lower(c.email) = lower(p_email)
      limit 1;
    end if;

    if v_contact_id is null and v_user_id is null then
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
        lower(p_email),
        extensions.crypt('TriadTrain2026!', extensions.gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('first_name', p_first_name, 'last_name', p_last_name),
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
        lower(p_email),
        jsonb_build_object(
          'sub', v_user_id::text,
          'email', lower(p_email),
          'email_verified', true
        ),
        'email',
        now(),
        now(),
        now()
      );

      select c.id into v_contact_id
      from public.contact c
      where c.user_id = v_user_id
      limit 1;
    end if;
  else
    select c.id into v_contact_id
    from public.contact c
    where c.first_name = p_first_name
      and c.last_name = p_last_name
      and c.email is null
    limit 1;

    if v_contact_id is null then
      insert into public.contact (first_name, last_name, email)
      values (p_first_name, p_last_name, null)
      returning id into v_contact_id;
    end if;
  end if;

  if v_contact_id is null then
    raise exception 'seed_triad_member: could not resolve contact for % %', p_first_name, p_last_name;
  end if;

  update public.contact
  set
    first_name = p_first_name,
    last_name = p_last_name,
    email = coalesce(lower(p_email), email),
    rx_gender = p_rx_gender,
    default_workout_scale = 'rx',
    weight_unit = 'lb',
    user_id = coalesce(user_id, v_user_id)
  where id = v_contact_id;

  if v_user_id is not null then
    insert into public.profiles (id, contact_id, display_name)
    values (v_user_id, v_contact_id, coalesce(p_display_name, p_first_name || ' ' || p_last_name))
    on conflict (id) do update
    set
      contact_id = excluded.contact_id,
      display_name = excluded.display_name;
  end if;

  select fm.id into v_fm_id
  from public.fitness_membership fm
  where fm.contact_id = v_contact_id
    and fm.gym_id = v_gym_id
    and fm.role = 'athlete'
  limit 1;

  if v_fm_id is null then
    insert into public.fitness_membership (
      contact_id,
      gym_id,
      role,
      membership_status,
      join_date,
      end_date
    )
    values (
      v_contact_id,
      v_gym_id,
      'athlete',
      'active',
      current_date,
      v_end_date
    )
    returning id into v_fm_id;
  else
    update public.fitness_membership
    set
      membership_status = 'active',
      end_date = v_end_date
    where id = v_fm_id;
  end if;

  -- Optional commercial offering row (uses first active offering at gym if present)
  select mo.id, mot.id
  into v_offering_id, v_term_id
  from public.membership_offering mo
  join public.membership_offering_term mot on mot.membership_offering_id = mo.id
  where mo.gym_id = v_gym_id
    and mo.is_active = true
    and mot.is_active = true
  order by mo.name, mot.term_months
  limit 1;

  if v_offering_id is not null and v_term_id is not null then
    select aos.id into v_offering_sub_id
    from public.athlete_offering_subscription aos
    where aos.contact_id = v_contact_id
      and aos.gym_id = v_gym_id
      and aos.membership_offering_id = v_offering_id
    limit 1;

    if v_offering_sub_id is null then
      insert into public.athlete_offering_subscription (
        contact_id,
        gym_id,
        fitness_membership_id,
        membership_offering_id,
        membership_offering_term_id,
        sold_price_cents,
        sold_commitment_total_cents,
        currency,
        start_date,
        end_date,
        status
      )
      select
        v_contact_id,
        v_gym_id,
        v_fm_id,
        v_offering_id,
        v_term_id,
        mot.price_cents,
        mot.price_cents * mot.term_months,
        mot.currency,
        current_date,
        v_end_date,
        'active'
      from public.membership_offering_term mot
      where mot.id = v_term_id
      returning id into v_offering_sub_id;
    else
      update public.athlete_offering_subscription
      set
        status = 'active',
        end_date = v_end_date,
        fitness_membership_id = v_fm_id
      where id = v_offering_sub_id;
    end if;
  end if;

  foreach v_lib_id in array array[v_cf_lib, v_hyrox_lib]
  loop
    if not exists (
      select 1
      from public.athlete_subscription s
      where s.contact_id = v_contact_id
        and s.gym_id = v_gym_id
        and s.program_library_id = v_lib_id
        and s.subscription_scope = 'athlete_track'
    ) then
      insert into public.athlete_subscription (
        contact_id,
        gym_id,
        fitness_membership_id,
        program_library_id,
        subscription_scope,
        status,
        start_date,
        end_date
      )
      values (
        v_contact_id,
        v_gym_id,
        v_fm_id,
        v_lib_id,
        'athlete_track',
        'active',
        current_date,
        v_end_date
      );
    else
      update public.athlete_subscription
      set
        status = 'active',
        end_date = v_end_date,
        fitness_membership_id = v_fm_id
      where contact_id = v_contact_id
        and gym_id = v_gym_id
        and program_library_id = v_lib_id
        and subscription_scope = 'athlete_track';
    end if;
  end loop;

  return v_contact_id;
end;
$$;

comment on function public.seed_triad_member is
  'POC: provision Triad Training athlete with CrossFit + Hyrox track access for one year. Creates auth user when email provided (temp password TriadTrain2026!).';

-- ---------------------------------------------------------------------------
-- 3. Run seeds (idempotent via helper)
-- ---------------------------------------------------------------------------
select public.seed_triad_member(
  'brooke.n.webber@gmail.com',
  'Brooke',
  'Jaworski',
  'female',
  'Brooke Jaworski'
);

select public.seed_triad_member(
  null,
  'Cody',
  'Houchin',
  'male',
  'Cody Houchin'
);

select public.seed_triad_member(
  'bobby@ftprehab.com',
  'Bobby',
  'Hines',
  'male',
  'Bobby Hines'
);

-- Drop seed function after use (keep gym data)
drop function if exists public.seed_triad_member (text, text, text, text, text);
