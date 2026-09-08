-- Allow time-based prescriptions (e.g. Ski 0:60, Row 2:00)

alter table public.programming_line_item
  drop constraint if exists programming_line_item_prescription_unit_check;

alter table public.programming_line_item
  add constraint programming_line_item_prescription_unit_check
  check (
    prescription_unit is null
    or prescription_unit in ('reps', 'meters', 'calories', 'feet', 'sets', 'seconds')
  );

comment on column public.programming_line_item.prescription_unit is
  'How reps_prescribed is interpreted: reps, meters, calories, feet, seconds (duration), or sets (complex_set only).';
