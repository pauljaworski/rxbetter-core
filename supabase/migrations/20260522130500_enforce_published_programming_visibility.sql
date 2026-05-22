-- Enforce the published_at draft boundary in RLS, not only in the client.

create or replace function public.can_read_programming (
  p_gym_id uuid,
  p_created_by_contact_id uuid,
  p_published_at timestamptz
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    p_created_by_contact_id = public.auth_contact_id ()
    or (
      p_gym_id is not null
      and (
        public.has_active_fm_any (
          p_gym_id,
          array['coach'::text, 'programmer'::text, 'admin'::text]
        )
        or (
          p_published_at is not null
          and public.has_active_fm_role (p_gym_id, 'athlete')
        )
      )
    );
$$;

comment on function public.can_read_programming (uuid, uuid, timestamptz) is
  'True for staff reading gym drafts/published WODs, athletes reading published WODs, or the athlete who owns custom programming.';

drop policy if exists programming_select on public.programming;

create policy programming_select on public.programming
  for select using (
    public.can_read_programming (gym_id, created_by_contact_id, published_at)
  );

drop policy if exists pli_select on public.programming_line_item;

create policy pli_select on public.programming_line_item
  for select using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and public.can_read_programming (
          p.gym_id,
          p.created_by_contact_id,
          p.published_at
        )
    )
  );

drop policy if exists pla_select on public.programming_library_assignment;

create policy pla_select on public.programming_library_assignment
  for select using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_library_assignment.programming_id
        and public.can_read_programming (
          p.gym_id,
          p.created_by_contact_id,
          p.published_at
        )
    )
  );

drop policy if exists athlete_performance_insert on public.athlete_performance;

create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    (
      contact_id = public.auth_contact_id ()
      and exists (
        select 1
        from public.fitness_membership fm
        where fm.contact_id = public.auth_contact_id ()
          and fm.role = 'athlete'
          and fm.membership_status = 'active'
          and (
            (
              athlete_performance.programming_id is null
              and athlete_performance.programming_line_item_id is null
            )
            or exists (
              select 1
              from public.programming p
              where p.id = athlete_performance.programming_id
                and (
                  (
                    p.gym_id = fm.gym_id
                    and p.published_at is not null
                  )
                  or (
                    p.created_by_contact_id = public.auth_contact_id ()
                    and p.source = 'athlete_custom'
                  )
                )
                and (
                  athlete_performance.programming_line_item_id is null
                  or exists (
                    select 1
                    from public.programming_line_item pli
                    where pli.id = athlete_performance.programming_line_item_id
                      and pli.programming_id = p.id
                  )
                )
            )
          )
      )
    )
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  );
