-- Remove SugarWOD bulk import (Jun–Jul 2026) — manual entry preferred
begin;

alter table public.programming disable trigger programming_update_guard;
alter table public.programming_line_item disable trigger pli_update_guard;

do $$
begin
  if exists (
    select 1
    from public.athlete_performance ap
    join public.programming p on p.id = ap.programming_id
    join public.gym g on g.id = p.gym_id
    where g.name ilike 'Triad Training'
      and p.wod_date between '2026-06-01' and '2026-07-25'
      and p.source = 'gym'
      and p.id::text like 'e5000000%'
  ) then
    raise exception 'Refusing to remove SugarWOD import rows that already have athlete scores';
  end if;
end $$;

delete from public.programming_library_assignment
where programming_id in (
  select p.id
  from public.programming p
  join public.gym g on g.id = p.gym_id
  where g.name ilike 'Triad Training'
    and p.wod_date between '2026-06-01' and '2026-07-25'
    and p.source = 'gym'
    and p.id::text like 'e5000000%'
);

delete from public.programming_line_item
where programming_id in (
  select p.id
  from public.programming p
  join public.gym g on g.id = p.gym_id
  where g.name ilike 'Triad Training'
    and p.wod_date between '2026-06-01' and '2026-07-25'
    and p.source = 'gym'
    and p.id::text like 'e5000000%'
);

delete from public.programming
where id in (
  select p.id
  from public.programming p
  join public.gym g on g.id = p.gym_id
  where g.name ilike 'Triad Training'
    and p.wod_date between '2026-06-01' and '2026-07-25'
    and p.source = 'gym'
    and p.id::text like 'e5000000%'
);

alter table public.programming enable trigger programming_update_guard;
alter table public.programming_line_item enable trigger pli_update_guard;

commit;
