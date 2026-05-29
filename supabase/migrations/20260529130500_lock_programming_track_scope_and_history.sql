-- Lock programming writes to every affected track and preserve athlete history.

create or replace function public.staff_can_manage_programming_libraries(
  p_gym_id uuid,
  p_library_ids uuid[]
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  with libs as (
    select distinct lib_id
    from unnest(coalesce(p_library_ids, '{}'::uuid[])) as t(lib_id)
    where lib_id is not null
  )
  select coalesce(
    p_gym_id is not null
    and p_gym_id in (select public.user_gym_ids ())
    and (
      (
        not exists (select 1 from libs)
        and (
          (
            public.has_active_fm_role (p_gym_id, 'programmer')
            and public.has_gym_staff_entitlement (p_gym_id, 'staff_programmer')
          )
          or (
            public.has_active_fm_role (p_gym_id, 'admin')
            and public.has_gym_staff_entitlement (p_gym_id, 'staff_admin')
          )
        )
      )
      or (
        exists (select 1 from libs)
        and not exists (
          select 1
          from libs l
          where not exists (
            select 1
            from public.program_library pl
            where pl.id = l.lib_id
              and pl.gym_id = p_gym_id
          )
        )
        and not exists (
          select 1
          from libs l
          where not (
            (
              public.has_active_fm_role (p_gym_id, 'programmer')
              and public.has_staff_library_scope (p_gym_id, l.lib_id, 'staff_programmer')
            )
            or (
              public.has_active_fm_role (p_gym_id, 'admin')
              and public.has_staff_library_scope (p_gym_id, l.lib_id, 'staff_admin')
            )
          )
        )
      )
    ),
    false
  );
$$;

comment on function public.staff_can_manage_programming_libraries (uuid, uuid[]) is
  'True only when the current staff user can manage every listed track for the gym.';

grant execute on function public.staff_can_manage_programming_libraries (uuid, uuid[]) to authenticated;

create or replace function public.staff_can_manage_programming(p_programming_id uuid)
  returns boolean
  language plpgsql
  stable
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_source text;
  v_library_ids uuid[];
begin
  select
    p.gym_id,
    p.source,
    coalesce(
      array_agg(distinct affected.library_id) filter (where affected.library_id is not null),
      '{}'::uuid[]
    )
  into v_gym, v_source, v_library_ids
  from public.programming p
  left join lateral (
    select p.program_library_id as library_id
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    where pla.programming_id = p.id
  ) affected on true
  where p.id = p_programming_id
  group by p.gym_id, p.source;

  if not found or v_source <> 'gym' then
    return false;
  end if;

  return public.staff_can_manage_programming_libraries(v_gym, v_library_ids);
end;
$$;

comment on function public.staff_can_manage_programming (uuid) is
  'RLS-safe staff write check for a gym programming row across all assigned tracks.';

grant execute on function public.staff_can_manage_programming (uuid) to authenticated;

create or replace function public.staff_can_delete_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select public.staff_can_manage_programming(p_programming_id);
$$;

comment on function public.staff_can_delete_programming (uuid) is
  'RLS-safe staff delete check for programming across all affected tracks.';

grant execute on function public.staff_can_delete_programming (uuid) to authenticated;

drop policy if exists programming_insert on public.programming;
create policy programming_insert on public.programming
  for insert with check (
    source = 'gym'
    and program_library_id is not null
    and public.staff_can_manage_programming_libraries (
      gym_id,
      array[program_library_id]::uuid[]
    )
  );

drop policy if exists pli_insert on public.programming_line_item;
create policy pli_insert on public.programming_line_item
  for insert with check (
    contact_id is null
    and public.staff_can_manage_programming (programming_id)
  );

create or replace function public.trg_enforce_programming_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_library_ids uuid[];
  v_coach_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if new.created_by_contact_id = public.auth_contact_id ()
     and old.created_by_contact_id = public.auth_contact_id ()
     and old.source = 'athlete_custom'
     and new.source = 'athlete_custom'
  then
    return new;
  end if;

  if old.source <> 'gym' or new.source <> 'gym' or new.gym_id is null then
    raise exception 'Insufficient privileges to update programming';
  end if;

  select coalesce(array_agg(distinct lib_id), '{}'::uuid[])
  into v_library_ids
  from (
    select old.program_library_id as lib_id
    union
    select new.program_library_id
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    where pla.programming_id = old.id
  ) affected
  where lib_id is not null;

  if public.staff_can_manage_programming_libraries(new.gym_id, v_library_ids) then
    return new;
  end if;

  v_coach_ok :=
    public.has_active_fm_role (new.gym_id, 'coach')
    and (
      (
        coalesce(array_length(v_library_ids, 1), 0) = 0
        and public.has_gym_staff_entitlement (new.gym_id, 'staff_coach')
      )
      or (
        coalesce(array_length(v_library_ids, 1), 0) > 0
        and not exists (
          select 1
          from unnest(v_library_ids) as l(lib_id)
          where not public.has_staff_library_scope (new.gym_id, l.lib_id, 'staff_coach')
        )
      )
    );

  if v_coach_ok then
    if (to_jsonb (new) - 'coaches_notes' - 'updated_at')
         = (to_jsonb (old) - 'coaches_notes' - 'updated_at')
    then
      return new;
    end if;
    raise exception 'Coaches may only update coaches_notes on programming';
  end if;

  raise exception 'Insufficient privileges to update programming';
end;
$$;

create or replace function public.trg_enforce_pli_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_lib uuid;
  v_author uuid;
  v_source text;
  v_library_ids uuid[];
  v_coach_ok boolean;
  v_athlete_ok boolean;
begin
  if auth.uid () is null then
    raise exception 'not authenticated';
  end if;

  if old.programming_id is distinct from new.programming_id
     and not public.staff_can_manage_programming(old.programming_id)
  then
    raise exception 'Insufficient privileges to move programming_line_item';
  end if;

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_gym, v_lib, v_author, v_source
  from public.programming p
  where p.id = new.programming_id;

  if not found then
    raise exception 'Invalid programming_id on programming_line_item';
  end if;

  if v_author = public.auth_contact_id ()
     and v_source = 'athlete_custom'
  then
    return new;
  end if;

  if v_gym is null or v_source <> 'gym' then
    raise exception 'Insufficient privileges to update programming_line_item';
  end if;

  select coalesce(array_agg(distinct lib_id), '{}'::uuid[])
  into v_library_ids
  from (
    select v_lib as lib_id
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    where pla.programming_id = new.programming_id
  ) affected
  where lib_id is not null;

  if public.staff_can_manage_programming_libraries(v_gym, v_library_ids) then
    return new;
  end if;

  v_coach_ok :=
    public.has_active_fm_role (v_gym, 'coach')
    and (
      (
        coalesce(array_length(v_library_ids, 1), 0) = 0
        and public.has_gym_staff_entitlement (v_gym, 'staff_coach')
      )
      or (
        coalesce(array_length(v_library_ids, 1), 0) > 0
        and not exists (
          select 1
          from unnest(v_library_ids) as l(lib_id)
          where not public.has_staff_library_scope (v_gym, l.lib_id, 'staff_coach')
        )
      )
    );

  if v_coach_ok then
    return new;
  end if;

  if old.contact_id is null then
    raise exception 'Log class results in athlete_performance (shared line item); do not update this row';
  end if;

  v_athlete_ok :=
    public.has_active_fm_role (v_gym, 'athlete')
    and public.has_athlete_track_access (v_gym, v_lib)
    and new.contact_id = public.auth_contact_id ()
    and old.contact_id = public.auth_contact_id ();

  if v_athlete_ok then
    if (
      to_jsonb (new)
        - 'actual_weight_lifted'
        - 'prescribed_score'
        - 'status'
        - 'completed_at'
        - 'updated_at'
    ) = (
      to_jsonb (old)
        - 'actual_weight_lifted'
        - 'prescribed_score'
        - 'status'
        - 'completed_at'
        - 'updated_at'
    )
    then
      return new;
    end if;
    raise exception 'Athletes may only update results fields on individualized programming_line_item';
  end if;

  raise exception 'Insufficient privileges to update programming_line_item';
end;
$$;

create or replace function public.delete_gym_programming_segment(p_programming_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_published_at timestamptz;
  v_segment_group_id uuid;
  v_has_history boolean;
begin
  if not public.staff_can_delete_programming(p_programming_id) then
    raise exception 'Not allowed to delete this programming segment';
  end if;

  select p.published_at, p.segment_group_id
  into v_published_at, v_segment_group_id
  from public.programming p
  where p.id = p_programming_id
    and p.source = 'gym';

  if not found then
    raise exception 'Programming segment not found';
  end if;

  select exists (
    select 1
    from public.athlete_performance ap
    where ap.programming_id = p_programming_id
       or (
         ap.programming_line_item_id is not null
         and exists (
           select 1
           from public.programming_line_item pli
           where pli.id = ap.programming_line_item_id
             and pli.programming_id = p_programming_id
         )
       )
       or (
         v_segment_group_id is not null
         and ap.segment_group_id = v_segment_group_id
       )
  )
  or exists (
    select 1
    from public.athlete_segment_completion asc_row
    where asc_row.programming_id = p_programming_id
       or (
         v_segment_group_id is not null
         and asc_row.segment_group_id = v_segment_group_id
       )
  )
  into v_has_history;

  if v_published_at is not null or v_has_history then
    update public.programming
    set published_at = null
    where id = p_programming_id;
    return;
  end if;

  delete from public.programming_line_item
  where programming_id = p_programming_id
    and contact_id is null;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  delete from public.programming
  where id = p_programming_id
    and source = 'gym';
end;
$$;

comment on function public.delete_gym_programming_segment (uuid) is
  'Staff-only: unpublish published/history-bearing segments; hard-delete only unpublished segments without athlete history.';

grant execute on function public.delete_gym_programming_segment (uuid) to authenticated;

create or replace function public.sync_programming_library_assignments(
  p_programming_id uuid,
  p_library_ids uuid[]
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_gym uuid;
  v_requested uuid[];
  v_affected uuid[];
begin
  select p.gym_id
  into v_gym
  from public.programming p
  where p.id = p_programming_id
    and p.source = 'gym';

  if v_gym is null then
    raise exception 'Programming segment not found';
  end if;

  select coalesce(array_agg(distinct lib_id), '{}'::uuid[])
  into v_requested
  from unnest(coalesce(p_library_ids, '{}'::uuid[])) as t(lib_id)
  where lib_id is not null;

  select coalesce(array_agg(distinct lib_id), '{}'::uuid[])
  into v_affected
  from (
    select unnest(v_requested) as lib_id
    union
    select p.program_library_id
    from public.programming p
    where p.id = p_programming_id
      and p.program_library_id is not null
    union
    select pla.program_library_id
    from public.programming_library_assignment pla
    where pla.programming_id = p_programming_id
  ) affected
  where lib_id is not null;

  if not public.staff_can_manage_programming_libraries(v_gym, v_affected) then
    raise exception 'Not allowed to update track assignments for this segment';
  end if;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  insert into public.programming_library_assignment (programming_id, program_library_id)
  select p_programming_id, lib_id
  from unnest(v_requested) as t(lib_id)
  on conflict do nothing;
end;
$$;

comment on function public.sync_programming_library_assignments (uuid, uuid[]) is
  'Staff-only: replace track assignments after validating scope for every existing and requested track.';

grant execute on function public.sync_programming_library_assignments (uuid, uuid[]) to authenticated;
