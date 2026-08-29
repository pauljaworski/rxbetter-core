-- Class Day lets coach and admin personas edit athlete scores, but
-- athlete_performance_update only allowed the athlete or is_gym_admin_scoped
-- (admin + staff_admin subscription). Owner and coach-only staff got a
-- silent 0-row update: the UI toasted success and the score never changed.

create or replace function public.staff_can_correct_class_performance (
  p_programming_id uuid,
  p_segment_group_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.programming p
      where p.id = p_programming_id
        and p.gym_id is not null
        and public.has_active_fm_any (p.gym_id, array['coach', 'admin', 'owner']::text[])
    )
    or exists (
      select 1
      from public.programming p
      where p_segment_group_id is not null
        and p.segment_group_id = p_segment_group_id
        and p.gym_id is not null
        and public.has_active_fm_any (p.gym_id, array['coach', 'admin', 'owner']::text[])
    );
$$;

comment on function public.staff_can_correct_class_performance (uuid, uuid) is
  'Coach/admin/owner at the gym that owns the class programming (or grouped block) may correct athlete_performance scores.';

grant execute on function public.staff_can_correct_class_performance (uuid, uuid) to authenticated;

drop policy if exists athlete_performance_update on public.athlete_performance;

create policy athlete_performance_update on public.athlete_performance
  for update using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
    or public.staff_can_correct_class_performance (
      programming_id,
      segment_group_id
    )
  )
  with check (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
    or public.staff_can_correct_class_performance (
      programming_id,
      segment_group_id
    )
  );
