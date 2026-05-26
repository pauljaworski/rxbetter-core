-- Bypass RLS on programming_library_assignment for staff delete/sync (avoids INSERT/DELETE policy failures).

create or replace function public.delete_gym_programming_segment(p_programming_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if not public.staff_can_delete_programming(p_programming_id) then
    raise exception 'Not allowed to delete this programming segment';
  end if;

  if not exists (
    select 1
    from public.programming p
    where p.id = p_programming_id
      and p.source = 'gym'
  ) then
    raise exception 'Programming segment not found';
  end if;

  update public.programming
  set published_at = null
  where id = p_programming_id;

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
  'Staff-only: remove a gym programming segment and its line items / track assignments.';

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

  delete from public.programming_library_assignment
  where programming_id = p_programming_id;

  if p_library_ids is null or coalesce(array_length(p_library_ids, 1), 0) = 0 then
    return;
  end if;

  foreach v_lib in array p_library_ids loop
    if not (
      (
        public.has_active_fm_role(v_gym, 'programmer')
        and public.has_staff_library_scope(v_gym, v_lib, 'staff_programmer')
      )
      or (
        public.has_active_fm_role(v_gym, 'admin')
        and public.has_staff_library_scope(v_gym, v_lib, 'staff_admin')
      )
    ) then
      raise exception 'Not allowed to assign library %', v_lib;
    end if;

    insert into public.programming_library_assignment (programming_id, program_library_id)
    values (p_programming_id, v_lib);
  end loop;
end;
$$;

comment on function public.sync_programming_library_assignments (uuid, uuid[]) is
  'Staff-only: replace track assignments for a programming segment (save section).';

grant execute on function public.delete_gym_programming_segment (uuid) to authenticated;
grant execute on function public.sync_programming_library_assignments (uuid, uuid[]) to authenticated;
