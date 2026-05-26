-- Allow gym staff to delete programming segments and gym-wide line items (builder trash).

create policy programming_delete on public.programming
  for delete using (
    gym_id in (select public.user_gym_ids ())
    and source = 'gym'
    and (
      (
        program_library_id is not null
        and (
          (
            public.has_active_fm_role (gym_id, 'programmer')
            and public.has_staff_library_scope (gym_id, program_library_id, 'staff_programmer')
          )
          or (
            public.has_active_fm_role (gym_id, 'admin')
            and public.has_staff_library_scope (gym_id, program_library_id, 'staff_admin')
          )
        )
      )
      or (
        program_library_id is null
        and (
          (
            public.has_active_fm_role (gym_id, 'programmer')
            and public.has_gym_staff_entitlement (gym_id, 'staff_programmer')
          )
          or (
            public.has_active_fm_role (gym_id, 'admin')
            and public.has_gym_staff_entitlement (gym_id, 'staff_admin')
          )
        )
      )
      or exists (
        select 1
        from public.programming_library_assignment pla
        where pla.programming_id = programming.id
          and (
            (
              public.has_active_fm_role (gym_id, 'programmer')
              and public.has_staff_library_scope (gym_id, pla.program_library_id, 'staff_programmer')
            )
            or (
              public.has_active_fm_role (gym_id, 'admin')
              and public.has_staff_library_scope (gym_id, pla.program_library_id, 'staff_admin')
            )
          )
      )
    )
  );

create policy pli_delete on public.programming_line_item
  for delete using (
    exists (
      select 1
      from public.programming p
      where p.id = programming_line_item.programming_id
        and p.gym_id in (select public.user_gym_ids ())
        and p.source = 'gym'
        and programming_line_item.contact_id is null
        and (
          (
            p.program_library_id is not null
            and (
              (
                public.has_active_fm_role (p.gym_id, 'programmer')
                and public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_programmer')
              )
              or (
                public.has_active_fm_role (p.gym_id, 'admin')
                and public.has_staff_library_scope (p.gym_id, p.program_library_id, 'staff_admin')
              )
            )
          )
          or (
            p.program_library_id is null
            and (
              (
                public.has_active_fm_role (p.gym_id, 'programmer')
                and public.has_gym_staff_entitlement (p.gym_id, 'staff_programmer')
              )
              or (
                public.has_active_fm_role (p.gym_id, 'admin')
                and public.has_gym_staff_entitlement (p.gym_id, 'staff_admin')
              )
            )
          )
          or exists (
            select 1
            from public.programming_library_assignment pla
            where pla.programming_id = p.id
              and (
                (
                  public.has_active_fm_role (p.gym_id, 'programmer')
                  and public.has_staff_library_scope (p.gym_id, pla.program_library_id, 'staff_programmer')
                )
                or (
                  public.has_active_fm_role (p.gym_id, 'admin')
                  and public.has_staff_library_scope (p.gym_id, pla.program_library_id, 'staff_admin')
                )
              )
          )
        )
    )
  );
