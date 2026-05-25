-- Add common Olympic / weightlifting movements missing from initial seed (Snatch Pull, Clean Pull, etc.)

insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation)
select v.name, v.stimulus, v.sub_stimulus, v.purpose_variation
from (
  values
    ('Snatch Pull', 'strength', 'pull', 'snatch'),
    ('Clean Pull', 'strength', 'pull', 'clean'),
    ('Muscle Snatch', 'strength', 'snatch', 'muscle'),
    ('Snatch Deadlift', 'strength', 'pull', 'snatch'),
    ('Clean Deadlift', 'strength', 'pull', 'clean'),
    ('Snatch High Pull', 'strength', 'pull', 'snatch'),
    ('Clean High Pull', 'strength', 'pull', 'clean'),
    ('Snatch Balance', 'strength', 'snatch', 'balance'),
    ('Clean Balance', 'strength', 'clean', 'balance'),
    ('Split Clean', 'strength', 'clean', 'split'),
    ('Power Jerk', 'strength', 'jerk', 'power'),
    ('Tall Snatch', 'strength', 'snatch', 'tall'),
    ('Tall Clean', 'strength', 'clean', 'tall'),
    ('Snatch Grip Deadlift', 'strength', 'pull', 'snatch grip'),
    ('Deficit Snatch', 'strength', 'snatch', 'deficit'),
    ('Deficit Clean', 'strength', 'clean', 'deficit'),
    ('Block Snatch', 'strength', 'snatch', 'block'),
    ('Block Clean', 'strength', 'clean', 'block')
) as v(name, stimulus, sub_stimulus, purpose_variation)
where not exists (
  select 1 from public.benchmark_type bt where lower(bt.name) = lower(v.name)
);

insert into public.benchmark_definition (benchmark_type_id, rep_count)
select bt.id, r.rep_count
from public.benchmark_type bt
cross join (values (1), (2), (3), (5), (10)) as r(rep_count)
where bt.stimulus = 'strength'
  and bt.name in (
    'Snatch Pull',
    'Clean Pull',
    'Muscle Snatch',
    'Snatch Deadlift',
    'Clean Deadlift',
    'Snatch High Pull',
    'Clean High Pull',
    'Snatch Balance',
    'Clean Balance',
    'Split Clean',
    'Power Jerk',
    'Tall Snatch',
    'Tall Clean',
    'Snatch Grip Deadlift',
    'Deficit Snatch',
    'Deficit Clean',
    'Block Snatch',
    'Block Clean'
  )
  and not exists (
    select 1
    from public.benchmark_definition bd
    where bd.benchmark_type_id = bt.id
      and bd.rep_count = r.rep_count
  );
