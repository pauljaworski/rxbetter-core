-- Platform-wide strength + skill movements (gym_id NULL → all gyms)

insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation, gym_id)
select v.name, v.stimulus, v.sub_stimulus, v.purpose_variation, null
from (
  values
    -- Strength
    ('Dumbbell Romanian Deadlifts', 'strength', 'pull', 'dumbbell'),
    ('Reverse Crunches', 'strength', null, 'core'),
    ('Dumbbell Bulgarian Split Squat', 'strength', 'squat', 'dumbbell'),
    ('DB Farmers Carry', 'strength', 'pull', 'dumbbell carry'),
    ('Kettlebell Single DB Box Step Up', 'strength', 'squat', 'step up'),
    ('Double Dumbbell Box Step Up', 'strength', 'squat', 'dumbbell'),
    ('Single Dumbbell Box Step Over', 'strength', 'squat', 'dumbbell'),
    ('Double Dumbbell Box Step Over', 'strength', 'squat', 'dumbbell'),
    ('Dumbbell Hang Cleans', 'strength', 'clean', 'dumbbell'),
    ('Dumbbells Hang Snatches', 'strength', 'snatch', 'dumbbell'),
    -- Skill
    ('Box Step Over', 'skill', 'squat', 'box'),
    ('Burpees Over Line', 'skill', null, 'conditioning')
) as v(name, stimulus, sub_stimulus, purpose_variation)
where not exists (
  select 1
  from public.benchmark_type bt
  where lower(bt.name) = lower(v.name)
    and bt.gym_id is null
);

-- Common rep-max definitions for the new strength movements
insert into public.benchmark_definition (benchmark_type_id, rep_count)
select bt.id, r.rep_count
from public.benchmark_type bt
cross join (values (1), (2), (3), (5), (10)) as r(rep_count)
where bt.gym_id is null
  and bt.stimulus = 'strength'
  and bt.name in (
    'Dumbbell Romanian Deadlifts',
    'Reverse Crunches',
    'Dumbbell Bulgarian Split Squat',
    'DB Farmers Carry',
    'Kettlebell Single DB Box Step Up',
    'Double Dumbbell Box Step Up',
    'Single Dumbbell Box Step Over',
    'Double Dumbbell Box Step Over',
    'Dumbbell Hang Cleans',
    'Dumbbells Hang Snatches'
  )
  and not exists (
    select 1
    from public.benchmark_definition bd
    where bd.benchmark_type_id = bt.id
      and bd.rep_count = r.rep_count
  );
