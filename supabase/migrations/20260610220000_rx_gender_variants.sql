-- Male / female Rx variants on line items; athlete gender for personalized display.

alter table public.programming_line_item
  add column if not exists rx_variants jsonb not null default '{}'::jsonb;

comment on column public.programming_line_item.rx_variants is
  'Optional { male, female } objects with reps, prescription_unit, weight_lb, load_label for gender-specific Rx.';

alter table public.contact
  add column if not exists rx_gender text
    check (rx_gender is null or rx_gender in ('male', 'female'));

comment on column public.contact.rx_gender is
  'Athlete Rx profile gender (male/female) for resolving M/F prescriptions. Null shows dual notation.';
