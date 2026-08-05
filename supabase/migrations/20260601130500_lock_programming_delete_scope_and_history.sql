-- Lock destructive programming paths to the exact tracks they affect and
-- preserve athlete history when staff removes published segments.

-- ---------------------------------------------------------------------------
-- Track/library invariants
-- ---------------------------------------------------------------------------
create or replace function public.trg_enforce_programming_library_gym ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_library_gym uuid;
begin
  if new.program_library_id is null then
    return new;
  end if;

  select pl.gym_id
    into v_library_gym
  from public.program_library pl
  where pl.id = new.program_library_id;

  if v_library_gym is null then
    raise exception 'programming: program_library % not found', new.program_library_id;
  end if;

  if new.gym_id is distinct from v_library_gym then
    raise exception 'programming: program_library % must belong to gym %',
      new.program_library_id, new.gym_id;
  end if;

  return new;
end;
$$;

drop trigger if exists programming_library_gym_guard on public.programming;

create trigger programming_library_gym_guard
  before insert or update of gym_id, program_library_id on public.programming
  for each row execute procedure public.trg_enforce_programming_library_gym ();

create or replace function public.trg_enforce_programming_assignment_gym ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_programming_gym uuid;
  v_library_gym uuid;
begin
  select p.gym_id
    into v_programming_gym
  from public.programming p
  where p.id = new.programming_id;

  if v_programming_gym is null then
    raise exception 'programming_library_assignment: programming % not found', new.programming_id;
  end if;

  select pl.gym_id
    into v_library_gym
  from public.program_library pl
  where pl.id = new.program_library_id;

  if v_library_gym is null then
    raise exception 'programming_library_assignment: program_library % not found',
      new.program_library_id;
  end if;

  if v_programming_gym is distinct from v_library_gym then
    raise exception 'programming_library_assignment: program_library % must belong to programming gym %',
      new.program_library_id, v_programming_gym;
  end if;

  return new;
end;
$$;

drop trigger if exists programming_assignment_gym_guard on public.programming_library_assignment;

create trigger programming_assignment_gym_guard
  before insert or update of programming_id, program_library_id
  on public.programming_library_assignment
  for each row execute procedure public.trg_enforce_programming_assignment_gym ();

-- Remove impossible cross-gym track links if any were created while the RPC
-- trusted gym-level staff entitlement without checking the library's gym.
delete from public.programming_library_assignment pla
using public.programming p, public.program_library pl
where pla.programming_id = p.id
  and pla.program_library_id = pl.id
  and p.gym_id is distinct from pl.gym_id;

update public.programming p
set program_library_id = null
where p.program_library_id is not null
  and not exists (
    select 1
    from public.program_library pl
    where pl.id = p.program_library_id
      and pl.gym_id = p.gym_id
  );

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
create or replace function public.staff_can_manage_programming_library(
  p_gym_id uuid,
  p_program_library_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select (
    p_program_library_id is null
    and (
      (
        public.has_active_fm_role(p_gym_id, 'programmer')
        and public.has_gym_staff_entitlement(p_gym_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role(p_gym_id, 'admin')
        and public.has_gym_staff_entitlement(p_gym_id, 'staff_admin')
      )
    )
  )
  or (
    p_program_library_id is not null
    and exists (
      select 1
      from public.program_library pl
      where pl.id = p_program_library_id
        and pl.gym_id = p_gym_id
    )
    and (
      (
        public.has_active_fm_role(p_gym_id, 'programmer')
        and public.has_staff_library_scope(p_gym_id, p_program_library_id, 'staff_programmer')
      )
      or (
        public.has_active_fm_role(p_gym_id, 'admin')
        and public.has_staff_library_scope(p_gym_id, p_program_library_id, 'staff_admin')
      )
    )
  );
$$;

comment on function public.staff_can_manage_programming_library (uuid, uuid) is
  'Programmer/admin write check for a gym-wide programming row or one specific track, including same-gym validation.';

grant execute on function public.staff_can_manage_programming_library (uuid, uuid) to authenticated;

create or replace function public.staff_can_manage_programming_tracks(p_programming_id uuid)
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
  assignments as (
    select pla.program_library_id
    from public.programming_library_assignment pla
    join target t on t.id = pla.programming_id
  )
  select exists (
    select 1
    from target t
    where (
      exists (select 1 from assignments)
      and not exists (
        select 1
        from assignments a
        where not public.staff_can_manage_programming_library(t.gym_id, a.program_library_id)
      )
    )
    or (
      not exists (select 1 from assignments)
      and public.staff_can_manage_programming_library(t.gym_id, t.program_library_id)
    )
  );
$$;

comment on function public.staff_can_manage_programming_tracks (uuid) is
  'True only when staff can manage every track currently attached to a gym programming segment.';

grant execute on function public.staff_can_manage_programming_tracks (uuid) to authenticated;

create or replace function public.staff_can_delete_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select public.staff_can_manage_programming_tracks(p_programming_id);
$$;

comment on function public.staff_can_delete_programming (uuid) is
  'RLS-safe destructive programming check: staff must manage every affected track.';

grant execute on function public.staff_can_delete_programming (uuid) to authenticated;

drop policy if exists programming_delete on public.programming;
drop policy if exists pli_delete on public.programming_line_item;
drop policy if exists pla_delete on public.programming_library_assignment;

create policy programming_delete on public.programming
  for delete using (public.staff_can_delete_programming(id));

create policy pli_delete on public.programming_line_item
  for delete using (
    contact_id is null
    and public.staff_can_delete_programming(programming_id)
  );

create policy pla_delete on public.programming_library_assignment
  for delete using (public.staff_can_delete_programming(programming_id));

-- ---------------------------------------------------------------------------
-- Destructive RPCs
-- ---------------------------------------------------------------------------
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
       or ap.programming_line_item_id in (
          select pli.id
          from public.programming_line_item pli
          where pli.programming_id = p_programming_id
       )
       or (
          v_segment_group_id is not null
          and ap.segment_group_id = v_segment_group_id
       )
  )
  or exists (
    select 1
    from public.athlete_segment_completion asc2
    where asc2.programming_id = p_programming_id
       or (
          v_segment_group_id is not null
          and asc2.segment_group_id = v_segment_group_id
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
  'Staff-only: delete unpublished gym programming, or unpublish published/history-bearing segments to preserve athlete history.';

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
  v_requested_library_ids uuid[];
begin
  if not public.staff_can_manage_programming_tracks(p_programming_id) then
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

  select coalesce(array_agg(distinct lib_id), array[]::uuid[])
    into v_requested_library_ids
  from unnest(coalesce(p_library_ids, array[]::uuid[])) as requested(lib_id)
  where lib_id is not null;

  if coalesce(array_length(v_requested_library_ids, 1), 0) = 0 then
    if not public.staff_can_manage_programming_library(v_gym, null) then
      raise exception 'Not allowed to make this segment gym-wide';
    end if;
  else
    foreach v_lib in array v_requested_library_ids loop
      if not public.staff_can_manage_programming_library(v_gym, v_lib) then
        raise exception 'Not allowed to assign library %', v_lib;
      end if;
    end loop;
  end if;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  foreach v_lib in array v_requested_library_ids loop
    insert into public.programming_library_assignment (programming_id, program_library_id)
    values (p_programming_id, v_lib);
  end loop;
end;
$$;

comment on function public.sync_programming_library_assignments (uuid, uuid[]) is
  'Staff-only: atomically replace track assignments after validating current and requested track scope.';

grant execute on function public.delete_gym_programming_segment (uuid) to authenticated;
grant execute on function public.sync_programming_library_assignments (uuid, uuid[]) to authenticated;
