-- Fix infinite recursion: programming_delete must not SELECT pla under RLS (pla_select reads programming).

drop policy if exists programming_delete on public.programming;
drop policy if exists pli_delete on public.programming_line_item;
drop policy if exists pla_delete on public.programming_library_assignment;

create or replace function public.staff_can_delete_programming(p_programming_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.programming p
    where p.id = p_programming_id
      and p.source = 'gym'
      and p.gym_id in (select public.user_gym_ids ())
      and (
        public.has_active_fm_role (p.gym_id, 'programmer')
        or public.has_active_fm_role (p.gym_id, 'admin')
      )
  );
$$;

comment on function public.staff_can_delete_programming (uuid) is
  'RLS-safe staff delete check for programming (avoids policy recursion via programming_library_assignment).';

grant execute on function public.staff_can_delete_programming (uuid) to authenticated;

create policy programming_delete on public.programming
  for delete using (public.staff_can_delete_programming (id));

create policy pli_delete on public.programming_line_item
  for delete using (
    contact_id is null
    and public.staff_can_delete_programming (programming_id)
  );

create policy pla_delete on public.programming_library_assignment
  for delete using (public.staff_can_delete_programming (programming_id));
