-- Multi-track publishing for programming + custom movement labels on line items.

-- ---------------------------------------------------------------------------
-- programming_library_assignment (many tracks per programming row)
-- ---------------------------------------------------------------------------
create table public.programming_library_assignment (
  programming_id       uuid not null references public.programming(id) on delete cascade,
  program_library_id   uuid not null references public.program_library(id) on delete cascade,
  created_at           timestamptz not null default now(),
  primary key (programming_id, program_library_id)
);

create index programming_library_assignment_library_idx
  on public.programming_library_assignment (program_library_id);

comment on table public.programming_library_assignment is
  'Publishes one programming segment to one or more program libraries/tracks.';

-- Backfill from legacy single program_library_id on programming.
insert into public.programming_library_assignment (programming_id, program_library_id)
select id, program_library_id
from public.programming
where program_library_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- programming_line_item.movement_label (custom "New" movements without catalog id)
-- ---------------------------------------------------------------------------
alter table public.programming_line_item
  add column if not exists movement_label text;

comment on column public.programming_line_item.movement_label is
  'Display name when benchmark_type_id is null (gym-specific movement not in global catalog).';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.programming_library_assignment enable row level security;

create policy pla_select on public.programming_library_assignment
  for select using (
    exists (
      select 1 from public.programming p
      where p.id = programming_library_assignment.programming_id
        and (
          (p.gym_id is not null and p.gym_id in (select public.user_gym_ids ()))
          or p.created_by_contact_id = public.auth_contact_id ()
        )
    )
  );

create policy pla_insert on public.programming_library_assignment
  for insert with check (
    exists (
      select 1 from public.programming p
      where p.id = programming_library_assignment.programming_id
        and p.gym_id in (select public.user_gym_ids ())
        and (
          (
            public.has_active_fm_role (p.gym_id, 'programmer')
            and public.has_staff_library_scope (
              p.gym_id,
              programming_library_assignment.program_library_id,
              'staff_programmer'
            )
          )
          or (
            public.has_active_fm_role (p.gym_id, 'admin')
            and public.has_staff_library_scope (
              p.gym_id,
              programming_library_assignment.program_library_id,
              'staff_admin'
            )
          )
        )
    )
  );

create policy pla_delete on public.programming_library_assignment
  for delete using (
    exists (
      select 1 from public.programming p
      where p.id = programming_library_assignment.programming_id
        and p.gym_id in (select public.user_gym_ids ())
        and (
          (
            public.has_active_fm_role (p.gym_id, 'programmer')
            and public.has_staff_library_scope (
              p.gym_id,
              programming_library_assignment.program_library_id,
              'staff_programmer'
            )
          )
          or (
            public.has_active_fm_role (p.gym_id, 'admin')
            and public.has_staff_library_scope (
              p.gym_id,
              programming_library_assignment.program_library_id,
              'staff_admin'
            )
          )
        )
    )
  );
