-- =============================================================================
-- Track links: keep link gym and offered program libraries in the same tenant
-- =============================================================================

-- Existing option rows are validated when inserted/updated, but changing the
-- parent link's gym_id could otherwise leave stale cross-gym options attached.
create or replace function public.fitness_track_link_validate_gym_update ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.gym_id is distinct from old.gym_id
     and exists (
       select 1
       from public.fitness_track_link_option o
       join public.program_library pl on pl.id = o.program_library_id
       where o.link_id = new.id
         and pl.gym_id <> new.gym_id
     )
  then
    raise exception 'fitness_track_link: cannot move link % to gym % while it has options from another gym',
      new.id, new.gym_id;
  end if;

  return new;
end;
$$;

drop trigger if exists fitness_track_link_validate_gym_update_trg
  on public.fitness_track_link;

create trigger fitness_track_link_validate_gym_update_trg
  before update of gym_id on public.fitness_track_link
  for each row execute procedure public.fitness_track_link_validate_gym_update ();

-- Public landing data should never advertise a track that no longer belongs to
-- the link gym, even if inconsistent rows predate this guard.
create or replace function public.get_fitness_track_link_public (p_link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.fitness_track_link%rowtype;
  v_result jsonb;
begin
  select * into v_link
  from public.fitness_track_link
  where id = p_link_id;

  if not found then
    return null;
  end if;

  if v_link.revoked_at is not null then
    return null;
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return null;
  end if;

  select jsonb_build_object(
    'link_id', v_link.id,
    'gym_id', v_link.gym_id,
    'gym_name', g.name,
    'label', v_link.label,
    'options', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'program_library_id', pl.id,
            'name', pl.name,
            'description', pl.description,
            'sport_type', pl.sport_type
          )
          order by pl.name
        )
        from public.fitness_track_link_option o
        join public.program_library pl
          on pl.id = o.program_library_id
         and pl.gym_id = v_link.gym_id
        where o.link_id = v_link.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.gym g
  where g.id = v_link.gym_id;

  return v_result;
end;
$$;

-- Claims must validate the same invariant at write time so stale options cannot
-- create athlete_subscription rows whose gym_id and program_library_id disagree.
create or replace function public.claim_fitness_track_link (
  p_link_id uuid,
  p_program_library_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.fitness_track_link%rowtype;
  v_contact_id uuid;
  v_fm_id uuid;
  v_sub_id uuid;
  v_created_fm boolean := false;
  v_created_sub boolean := false;
  v_will_consume_slot boolean := false;
begin
  if auth.uid () is null then
    raise exception 'claim_fitness_track_link: authentication required';
  end if;

  v_contact_id := public.auth_contact_id ();

  if v_contact_id is null then
    raise exception 'claim_fitness_track_link: no contact for current user';
  end if;

  select * into v_link
  from public.fitness_track_link
  where id = p_link_id
  for update;

  if not found then
    raise exception 'claim_fitness_track_link: link not found';
  end if;

  if v_link.revoked_at is not null then
    raise exception 'claim_fitness_track_link: link revoked';
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    raise exception 'claim_fitness_track_link: link expired';
  end if;

  if not exists (
    select 1
    from public.fitness_track_link_option o
    join public.program_library pl
      on pl.id = o.program_library_id
     and pl.gym_id = v_link.gym_id
    where o.link_id = p_link_id
      and o.program_library_id = p_program_library_id
  ) then
    raise exception 'claim_fitness_track_link: program_library not offered by this link gym';
  end if;

  select id into v_fm_id
  from public.fitness_membership
  where contact_id = v_contact_id
    and gym_id = v_link.gym_id
    and role = 'athlete';

  if v_fm_id is null then
    v_will_consume_slot := true;
  elsif not exists (
    select 1
    from public.athlete_subscription s
    where s.contact_id = v_contact_id
      and s.gym_id = v_link.gym_id
      and s.program_library_id = p_program_library_id
      and s.subscription_scope = 'athlete_track'
      and s.status = 'active'
  ) then
    v_will_consume_slot := true;
  end if;

  if v_link.max_redemptions is not null
     and v_will_consume_slot
     and v_link.redemption_count >= v_link.max_redemptions then
    raise exception 'claim_fitness_track_link: link redemption limit reached';
  end if;

  if v_fm_id is null then
    insert into public.fitness_membership (
      contact_id, gym_id, role, membership_status, join_date
    )
    values (
      v_contact_id, v_link.gym_id, 'athlete', 'active', current_date
    )
    returning id into v_fm_id;

    v_created_fm := true;
  else
    update public.fitness_membership
    set membership_status = 'active', updated_at = now ()
    where id = v_fm_id
      and membership_status <> 'active';
  end if;

  select id into v_sub_id
  from public.athlete_subscription
  where contact_id = v_contact_id
    and gym_id = v_link.gym_id
    and program_library_id = p_program_library_id
    and subscription_scope = 'athlete_track';

  if v_sub_id is null then
    insert into public.athlete_subscription (
      contact_id,
      gym_id,
      fitness_membership_id,
      program_library_id,
      subscription_scope,
      status,
      start_date
    )
    values (
      v_contact_id,
      v_link.gym_id,
      v_fm_id,
      p_program_library_id,
      'athlete_track',
      'active',
      current_date
    )
    returning id into v_sub_id;

    v_created_sub := true;
  else
    update public.athlete_subscription
    set
      status = 'active',
      fitness_membership_id = coalesce (fitness_membership_id, v_fm_id),
      updated_at = now ()
    where id = v_sub_id
      and (
        status is distinct from 'active'
        or fitness_membership_id is distinct from v_fm_id
      );
  end if;

  if v_created_fm or v_created_sub then
    update public.fitness_track_link
    set redemption_count = redemption_count + 1,
        updated_at = now ()
    where id = p_link_id;
  end if;

  return jsonb_build_object(
    'gym_id', v_link.gym_id,
    'program_library_id', p_program_library_id,
    'created_membership', v_created_fm,
    'created_subscription', v_created_sub
  );
end;
$$;

comment on function public.get_fitness_track_link_public (uuid) is
  'Returns gym + same-gym track options for a valid link token; no auth required. Inactive/revoked/expired links return null.';

comment on function public.claim_fitness_track_link (uuid, uuid) is
  'Authenticated athlete: validates link + same-gym option, ensures athlete fitness_membership and athlete_track subscription; increments redemption_count only when a new membership or subscription row is inserted.';
