-- complex_set rows: reps_prescribed is set count, not reps

alter table public.programming_line_item
  drop constraint if exists programming_line_item_prescription_unit_check;

alter table public.programming_line_item
  add constraint programming_line_item_prescription_unit_check
  check (
    prescription_unit is null
    or prescription_unit in ('reps', 'meters', 'calories', 'feet', 'sets')
  );

comment on column public.programming_line_item.prescription_unit is
  'How reps_prescribed is interpreted: reps, meters, calories, feet, or sets (complex_set only).';

update public.programming_line_item
set prescription_unit = 'sets'
where line_item_kind = 'complex_set'
  and reps_prescribed is not null
  and (prescription_unit is null or prescription_unit = 'reps');
