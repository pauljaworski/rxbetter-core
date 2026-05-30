-- Lock multi-track programming writes to every affected track and preserve athlete history on remove.

create or replace function public.staff_can_manage_programming_library (
  p_gym_id uuid,
  p_program_library_id uuid,
  p_role text,
  p_scope text
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    p_gym_id is not null
    and public.has_active_fm_role(p_gym_id, p_role)
    and (
      (
        p_program_library_id is null
        and public.has_gym_staff_entitlement(p_gym_id, p_scope)
      )
      or (
        p_program_library_id is not null
        and exists (
          select 1
          from public.program_library pl
          where pl.id = p_program_library_id
            and pl.gym_id = p_gym_id
        )
        and public.has_staff_library_scope(p_gym_id, p_program_library_id, p_scope)
      )
    );
$$;

comment on function public.staff_can_manage_programming_library (uuid, uuid, text, text) is
  'True when the current user has the requested staff role/scope for a gym track (or gym-level entitlement for null track).';

create or replace function public.staff_can_manage_programming_for_scope (
  p_programming_id uuid,
  p_library_ids uuid[],
  p_role text,
  p_scope text
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  with target as (
    select p.id, p.gym_id, p.program_library_id
    from public.programming p
    where p.id = p_programming_id
      and p.source = 'gym'
      and p.gym_id in (select public.user_gym_ids())
  ),
  affected_libraries as (
    select distinct pla.program_library_id as program_library_id
    from public.programming_library_assignment pla
    join target t on t.id = pla.programming_id
    union
    select distinct t.program_library_id
    from target t
    where t.program_library_id is not null
    union
    select distinct lib_id
    from unnest(coalesce(p_library_ids, '{}'::uuid[])) as requested(lib_id)
    where lib_id is not null
  )
  select coalesce((
    select
      case
        when exists (select 1 from affected_libraries) then
          not exists (
            select 1
            from affected_libraries al
            where not public.staff_can_manage_programming_library(
              t.gym_id,
              al.program_library_id,
              p_role,
              p_scope
            )
          )
        else
          public.staff_can_manage_programming_library(t.gym_id, null, p_role, p_scope)
      end
    from target t
  ), false);
$$;

comment on function public.staff_can_manage_programming_for_scope (uuid, uuid[], text, text) is
  'True when the current user has one staff scope for every existing and requested track on a gym programming segment.';

create or replace function public.staff_can_manage_programming (
  p_programming_id uuid,
  p_library_ids uuid[] default null
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  with target as (
    select p.id, p.gym_id, p.program_library_id
    from public.programming p
    where p.id = p_programming_id
      and p.source = 'gym'
      and p.gym_id in (select public.user_gym_ids())
  ),
  affected_libraries as (
    select distinct pla.program_library_id as program_library_id
    from public.programming_library_assignment pla
    join target t on t.id = pla.programming_id
    union
    select distinct t.program_library_id
    from target t
    where t.program_library_id is not null
    union
    select distinct lib_id
    from unnest(coalesce(p_library_ids, '{}'::uuid[])) as requested(lib_id)
    where lib_id is not null
  )
  select coalesce((
    select
      case
        when exists (select 1 from affected_libraries) then
          not exists (
            select 1
            from affected_libraries al
            where not (
              public.staff_can_manage_programming_library(
                t.gym_id,
                al.program_library_id,
                'programmer',
                'staff_programmer'
              )
              or public.staff_can_manage_programming_library(
                t.gym_id,
                al.program_library_id,
                'admin',
                'staff_admin'
              )
            )
          )
        else
          public.staff_can_manage_programming_library(t.gym_id, null, 'programmer', 'staff_programmer')
          or public.staff_can_manage_programming_library(t.gym_id, null, 'admin', 'staff_admin')
      end
    from target t
  ), false);
$$;

comment on function public.staff_can_manage_programming (uuid, uuid[]) is
  'True when the current user can administer every track affected by a gym programming segment write.';

create or replace function public.staff_can_delete_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select public.staff_can_manage_programming(p_programming_id, null);
$$;

comment on function public.staff_can_delete_programming (uuid) is
  'RLS-safe staff delete check requiring access to every track assigned to the programming segment.';

grant execute on function public.staff_can_manage_programming_library (uuid, uuid, text, text) to authenticated;
grant execute on function public.staff_can_manage_programming_for_scope (uuid, uuid[], text, text) to authenticated;
grant execute on function public.staff_can_manage_programming (uuid, uuid[]) to authenticated;
grant execute on function public.staff_can_delete_programming (uuid) to authenticated;

drop policy if exists programming_insert on public.programming;
create policy programming_insert on public.programming
  for insert with check (
    source = 'gym'
    and gym_id in (select public.user_gym_ids())
    and program_library_id is not null
    and (
      public.staff_can_manage_programming_library(gym_id, program_library_id, 'programmer', 'staff_programmer')
      or public.staff_can_manage_programming_library(gym_id, program_library_id, 'admin', 'staff_admin')
    )
  );

drop policy if exists pli_insert on public.programming_line_item;
create policy pli_insert on public.programming_line_item
  for insert with check (
    contact_id is null
    and public.staff_can_manage_programming(programming_id, null)
  );

drop policy if exists pla_insert on public.programming_library_assignment;
create policy pla_insert on public.programming_library_assignment
  for insert with check (
    public.staff_can_manage_programming(
      programming_library_assignment.programming_id,
      array[programming_library_assignment.program_library_id]
    )
  );

drop policy if exists pla_delete on public.programming_library_assignment;
create policy pla_delete on public.programming_library_assignment
  for delete using (
    public.staff_can_manage_programming(
      programming_library_assignment.programming_id,
      array[programming_library_assignment.program_library_id]
    )
  );

create or replace function public.trg_enforce_programming_update ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_extra_libraries uuid[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if old.source = 'athlete_custom'
     and old.created_by_contact_id = public.auth_contact_id()
  then
    if new.source = 'athlete_custom'
       and new.created_by_contact_id = old.created_by_contact_id
       and new.gym_id is not distinct from old.gym_id
    then
      return new;
    end if;

    raise exception 'Athlete custom programming cannot be promoted or reassigned';
  end if;

  if old.source <> 'gym'
     or new.source <> 'gym'
     or new.gym_id is distinct from old.gym_id
  then
    raise exception 'Insufficient privileges to update programming';
  end if;

  v_extra_libraries := array_remove(array[new.program_library_id], null);

  if public.staff_can_manage_programming(old.id, v_extra_libraries) then
    return new;
  end if;

  if public.staff_can_manage_programming_for_scope(
    old.id,
    v_extra_libraries,
    'coach',
    'staff_coach'
  ) then
    if (to_jsonb(new) - 'coaches_notes' - 'updated_at')
       = (to_jsonb(old) - 'coaches_notes' - 'updated_at')
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
  v_athlete_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if new.programming_id is distinct from old.programming_id then
    raise exception 'Programming line items cannot be reassigned between segments';
  end if;

  select p.gym_id, p.program_library_id, p.created_by_contact_id, p.source
    into v_gym, v_lib, v_author, v_source
  from public.programming p
  where p.id = new.programming_id;

  if not found then
    raise exception 'Invalid programming_id on programming_line_item';
  end if;

  if v_author = public.auth_contact_id()
     and v_source = 'athlete_custom'
  then
    return new;
  end if;

  if v_source <> 'gym' or v_gym is null then
    raise exception 'Insufficient privileges to update programming_line_item';
  end if;

  if public.staff_can_manage_programming(new.programming_id, null) then
    return new;
  end if;

  if public.staff_can_manage_programming_for_scope(
    new.programming_id,
    null,
    'coach',
    'staff_coach'
  ) then
    return new;
  end if;

  if old.contact_id is null then
    raise exception 'Log class results in athlete_performance (shared line item); do not update this row';
  end if;

  v_athlete_ok :=
    public.has_active_fm_role(v_gym, 'athlete')
    and public.has_athlete_track_access(v_gym, v_lib)
    and new.contact_id = public.auth_contact_id()
    and old.contact_id = public.auth_contact_id();

  if v_athlete_ok then
    if (
      to_jsonb(new)
        - 'actual_weight_lifted'
        - 'prescribed_score'
        - 'status'
        - 'completed_at'
        - 'updated_at'
    ) = (
      to_jsonb(old)
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
  v_lib uuid;
begin
  if not public.staff_can_manage_programming(p_programming_id, p_library_ids) then
    raise exception 'Not allowed to update track assignments for this segment';
  end if;

  select p.gym_id
  into v_gym
  from public.programming p
  where p.id = p_programming_id
    and p.source = 'gym';

  if v_gym is null then
    raise exception 'Programming segment not found';
  end if;

  foreach v_lib in array coalesce(p_library_ids, '{}'::uuid[]) loop
    if v_lib is not null
       and not exists (
         select 1
         from public.program_library pl
         where pl.id = v_lib
           and pl.gym_id = v_gym
       )
    then
      raise exception 'Track % does not belong to this gym', v_lib;
    end if;
  end loop;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  insert into public.programming_library_assignment (programming_id, program_library_id)
  select distinct p_programming_id, lib_id
  from unnest(coalesce(p_library_ids, '{}'::uuid[])) as requested(lib_id)
  where lib_id is not null;
end;
$$;

comment on function public.sync_programming_library_assignments (uuid, uuid[]) is
  'Staff-only: replace track assignments only when the caller can administer every existing and requested track.';

create or replace function public.delete_gym_programming_segment(p_programming_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_was_published boolean;
  v_has_history boolean;
begin
  if not public.staff_can_manage_programming(p_programming_id, null) then
    raise exception 'Not allowed to delete this programming segment';
  end if;

  select
    p.published_at is not null,
    exists (
      select 1
      from public.athlete_performance ap
      where ap.programming_id = p.id
        or ap.programming_line_item_id in (
          select pli.id
          from public.programming_line_item pli
          where pli.programming_id = p.id
        )
        or (
          p.segment_group_id is not null
          and ap.segment_group_id = p.segment_group_id
        )
    )
    or exists (
      select 1
      from public.athlete_segment_completion ascx
      where ascx.programming_id = p.id
        or (
          p.segment_group_id is not null
          and ascx.segment_group_id = p.segment_group_id
        )
    )
  into v_was_published, v_has_history
  from public.programming p
  where p.id = p_programming_id
    and p.source = 'gym';

  if not found then
    raise exception 'Programming segment not found';
  end if;

  if v_was_published or v_has_history then
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
  'Staff-only: deletes draft/no-history segments; published or history-bearing segments are unpublished to preserve athlete results.';

grant execute on function public.delete_gym_programming_segment (uuid) to authenticated;
grant execute on function public.sync_programming_library_assignments (uuid, uuid[]) to authenticated;
