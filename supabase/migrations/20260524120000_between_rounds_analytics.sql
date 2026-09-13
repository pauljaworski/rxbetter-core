-- Include between-rounds metcon movements in movement exposure analytics.
create or replace view public.programming_movement_exposure as
select
  p.gym_id,
  p.wod_date,
  p.programming_segment,
  p.metcon_format,
  pli.id as programming_line_item_id,
  pli.line_item_kind,
  coalesce(bt.name, pli.movement_label, comp.movement_label) as movement_name,
  coalesce(comp.reps, pli.reps_prescribed) as reps_prescribed
from public.programming p
join public.programming_line_item pli on pli.programming_id = p.id and pli.contact_id is null
left join public.benchmark_type bt on bt.id = pli.benchmark_type_id
left join public.pli_movement_components comp on comp.programming_line_item_id = pli.id
where pli.line_item_kind in ('metcon_movement', 'between_rounds', 'strength_set', 'complex_set');
