-- Keep programming delete/sync authorization scoped to every affected track.
-- The helper stays SECURITY DEFINER to avoid the programming <-> PLA RLS recursion,
-- but it must not fall back to gym-role-only authorization.

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
  select exists (
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
  );
$$;

comment on function public.staff_can_manage_programming_library (uuid, uuid) is
  'True when the current staff user can manage the specified programming track in the gym.';

create or replace function public.staff_can_manage_unassigned_programming(p_gym_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select (
    public.has_active_fm_role(p_gym_id, 'programmer')
    and public.has_gym_staff_entitlement(p_gym_id, 'staff_programmer')
  )
  or (
    public.has_active_fm_role(p_gym_id, 'admin')
    and public.has_gym_staff_entitlement(p_gym_id, 'staff_admin')
  );
$$;

comment on function public.staff_can_manage_unassigned_programming (uuid) is
  'True when the current staff user can manage gym programming that has no track assignment.';

create or replace function public.staff_can_delete_programming(p_programming_id uuid)
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
      and p.gym_id in (select public.user_gym_ids ())
  )
  select exists (
    select 1
    from target p
    where (
      exists (
        select 1
        from public.programming_library_assignment pla
        where pla.programming_id = p.id
      )
      and not exists (
        select 1
        from public.programming_library_assignment pla
        where pla.programming_id = p.id
          and not public.staff_can_manage_programming_library(
            p.gym_id,
            pla.program_library_id
          )
      )
    )
    or (
      not exists (
        select 1
        from public.programming_library_assignment pla
        where pla.programming_id = p.id
      )
      and p.program_library_id is not null
      and public.staff_can_manage_programming_library(p.gym_id, p.program_library_id)
    )
    or (
      not exists (
        select 1
        from public.programming_library_assignment pla
        where pla.programming_id = p.id
      )
      and p.program_library_id is null
      and public.staff_can_manage_unassigned_programming(p.gym_id)
    )
  );
$$;

comment on function public.staff_can_delete_programming (uuid) is
  'RLS-safe staff delete/sync check requiring access to every assigned programming track.';

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
begin
  if not public.staff_can_delete_programming(p_programming_id) then
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

  if p_library_ids is not null
     and coalesce(array_length(p_library_ids, 1), 0) > 0
     and exists (
       select 1
       from unnest(p_library_ids) as requested(program_library_id)
       where requested.program_library_id is null
          or not public.staff_can_manage_programming_library(
            v_gym,
            requested.program_library_id
          )
     )
  then
    raise exception 'Not allowed to assign one or more requested tracks';
  end if;

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  if p_library_ids is null or coalesce(array_length(p_library_ids, 1), 0) = 0 then
    return;
  end if;

  insert into public.programming_library_assignment (programming_id, program_library_id)
  select distinct p_programming_id, requested.program_library_id
  from unnest(p_library_ids) as requested(program_library_id);
end;
$$;

comment on function public.sync_programming_library_assignments (uuid, uuid[]) is
  'Staff-only: replace track assignments after validating all current and requested tracks.';

grant execute on function public.staff_can_manage_programming_library (uuid, uuid) to authenticated;
grant execute on function public.staff_can_manage_unassigned_programming (uuid) to authenticated;
grant execute on function public.staff_can_delete_programming (uuid) to authenticated;
grant execute on function public.sync_programming_library_assignments (uuid, uuid[]) to authenticated;
