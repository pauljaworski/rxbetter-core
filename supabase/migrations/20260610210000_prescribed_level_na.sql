-- Prescribed level N/A for segments where scale tier does not apply (e.g. skill, mono).

alter type public.workout_scale add value if not exists 'na';

comment on column public.programming.prescribed_scale is
  'Prescribed tier for the segment (Rx+ / Rx / Fx / Scaled / N/A). N/A = no prescribed scale.';
