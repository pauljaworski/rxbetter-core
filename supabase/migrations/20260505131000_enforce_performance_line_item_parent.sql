-- ============================================================================
-- Athlete performance ledger integrity.
-- Results linked to a programming_line_item must point at that line item's
-- parent programming row, and programming references must stay in scope.
-- ============================================================================

create or replace function public.athlete_performance_line_item_is_consistent (
  p_contact_id uuid,
  p_programming_id uuid,
  p_programming_line_item_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    p_programming_line_item_id is null
    or exists (
      select 1
      from public.programming_line_item pli
      where pli.id = p_programming_line_item_id
        and pli.programming_id = p_programming_id
        and (
          pli.contact_id is null
          or pli.contact_id = p_contact_id
        )
    );
$$;

comment on function public.athlete_performance_line_item_is_consistent (uuid, uuid, uuid) is
  'Ensures athlete_performance rows cannot pair a WOD result with a line item from a different programming row or another athlete individualization.';

create or replace function public.athlete_performance_write_scope_ok (
  p_contact_id uuid,
  p_programming_id uuid,
  p_programming_line_item_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select public.athlete_performance_line_item_is_consistent (
      p_contact_id,
      p_programming_id,
      p_programming_line_item_id
    )
    and (
      (
        p_contact_id = public.auth_contact_id ()
        and exists (
          select 1
          from public.fitness_membership fm
          where fm.contact_id = public.auth_contact_id ()
            and fm.role = 'athlete'
            and fm.membership_status = 'active'
            and (
              p_programming_id is null
              or exists (
                select 1
                from public.programming p
                where p.id = p_programming_id
                  and (
                    (
                      p.gym_id is not null
                      and p.gym_id = fm.gym_id
                    )
                    or (
                      p.gym_id is null
                      and p.created_by_contact_id = public.auth_contact_id ()
                    )
                  )
              )
            )
        )
      )
      or exists (
        select 1
        from public.fitness_membership fm
        where fm.contact_id = p_contact_id
          and public.is_gym_admin_scoped (fm.gym_id)
          and (
            p_programming_id is null
            or exists (
              select 1
              from public.programming p
              where p.id = p_programming_id
                and p.gym_id = fm.gym_id
            )
          )
      )
    );
$$;

comment on function public.athlete_performance_write_scope_ok (uuid, uuid, uuid) is
  'Shared RLS write check for athlete_performance: self/admin scope plus programming_line_item parent integrity.';

create or replace function public.athlete_performance_read_scope_ok (
  p_contact_id uuid,
  p_programming_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select
    p_contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = p_contact_id
        and fm.gym_id in (select public.user_gym_ids ())
        and (
          p_programming_id is null
          or exists (
            select 1
            from public.programming p
            where p.id = p_programming_id
              and (
                p.gym_id = fm.gym_id
                or (
                  p.gym_id is null
                  and p.created_by_contact_id = public.auth_contact_id ()
                )
              )
          )
        )
    );
$$;

comment on function public.athlete_performance_read_scope_ok (uuid, uuid) is
  'Shared RLS read check for athlete_performance: gym WOD results remain gym-visible, personal off-tenant results stay athlete-owned.';

drop policy if exists athlete_performance_select on public.athlete_performance;
drop policy if exists athlete_performance_insert on public.athlete_performance;
drop policy if exists athlete_performance_update on public.athlete_performance;

create policy athlete_performance_select on public.athlete_performance
  for select using (
    public.athlete_performance_read_scope_ok (
      contact_id,
      programming_id
    )
  );

create policy athlete_performance_insert on public.athlete_performance
  for insert with check (
    public.athlete_performance_write_scope_ok (
      contact_id,
      programming_id,
      programming_line_item_id
    )
  );

create policy athlete_performance_update on public.athlete_performance
  for update using (
    contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = athlete_performance.contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  )
  with check (
    public.athlete_performance_write_scope_ok (
      contact_id,
      programming_id,
      programming_line_item_id
    )
  );
