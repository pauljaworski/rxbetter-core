-- Platform-wide strength + skill movements used in CrossFit programming (gym_id NULL → all gyms)

insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation, gym_id)
select v.name, v.stimulus, v.sub_stimulus, v.purpose_variation, null
from (
  values
    -- Strength
    ('Goblet Squat', 'strength', 'squat', 'kettlebell'),
    ('Dumbbell Front Squat', 'strength', 'squat', 'dumbbell'),
    ('Dumbbell Squat', 'strength', 'squat', 'dumbbell'),
    ('Dumbbell Deadlift', 'strength', 'pull', 'dumbbell'),
    ('Dumbbell Push Press', 'strength', 'press', 'dumbbell'),
    ('Dumbbell Push Jerk', 'strength', 'jerk', 'dumbbell'),
    ('Dumbbell Clean & Jerk', 'strength', 'combined', 'dumbbell'),
    ('Alternating Dumbbell Snatch', 'strength', 'snatch', 'dumbbell'),
    ('Double Dumbbell Snatch', 'strength', 'snatch', 'dumbbell'),
    ('Shoulder to Overhead', 'strength', 'press', 'sto'),
    ('Ground to Overhead', 'strength', 'combined', 'gto'),
    ('Walking Lunge', 'strength', 'squat', 'lunge'),
    ('Reverse Lunge', 'strength', 'squat', 'lunge'),
    ('Front Rack Lunge', 'strength', 'squat', 'lunge'),
    ('Overhead Lunge', 'strength', 'squat', 'lunge'),
    ('Bulgarian Split Squat', 'strength', 'squat', 'single leg'),
    ('Good Morning', 'strength', 'pull', 'hinge'),
    ('Barbell Row', 'strength', 'pull', 'row'),
    ('Pendlay Row', 'strength', 'pull', 'row'),
    ('Kettlebell Clean', 'strength', 'clean', 'kettlebell'),
    ('Kettlebell Snatch', 'strength', 'snatch', 'kettlebell'),
    ('Kettlebell Thruster', 'strength', 'combined', 'kettlebell'),
    ('Kettlebell Deadlift', 'strength', 'pull', 'kettlebell'),
    ('Turkish Get-Up', 'strength', 'combined', 'kettlebell'),
    ('Sandbag Clean', 'strength', 'clean', 'odd object'),
    ('Sandbag Carry', 'strength', 'pull', 'odd object'),
    ('D-ball Clean', 'strength', 'clean', 'odd object'),
    ('D-ball Over Shoulder', 'strength', 'combined', 'odd object'),
    ('Slam Ball', 'strength', 'combined', 'medicine ball'),
    ('Suitcase Carry', 'strength', 'pull', 'carry'),
    ('Overhead Carry', 'strength', 'press', 'carry'),
    ('Pause Front Squat', 'strength', 'squat', 'tempo'),
    ('Tempo Back Squat', 'strength', 'squat', 'tempo'),
    ('Deficit Deadlift', 'strength', 'pull', 'deficit'),
    ('Rack Pull', 'strength', 'pull', 'partial'),
    ('Floor Press', 'strength', 'press', 'bench'),
    ('Close-Grip Bench', 'strength', 'press', 'bench'),
    ('Hip Thrust', 'strength', 'pull', 'posterior'),
    ('Glute Bridge', 'strength', 'pull', 'posterior'),
    ('Renegade Row', 'strength', 'pull', 'dumbbell'),
    ('Man Maker', 'strength', 'combined', 'dumbbell'),
    ('Behind-the-Neck Push Press', 'strength', 'press', 'btn'),
    ('Behind-the-Neck Jerk', 'strength', 'jerk', 'btn'),
    ('Plate Ground-to-Overhead', 'strength', 'combined', 'plate'),
    -- Skill
    ('Air Squat', 'skill', 'squat', 'gymnastics'),
    ('Butterfly Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Jumping Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Jumping Chest-to-Bar', 'skill', 'pull', 'gymnastics'),
    ('Chin-Up', 'skill', 'pull', 'gymnastics'),
    ('Strict Chest-to-Bar', 'skill', 'pull', 'gymnastics'),
    ('Knees-to-Elbows', 'skill', 'pull', 'gymnastics'),
    ('Knees-to-Chest', 'skill', 'pull', 'gymnastics'),
    ('Strict Toes-to-Bar', 'skill', 'pull', 'gymnastics'),
    ('Toes-to-Rings', 'skill', 'pull', 'gymnastics'),
    ('Hollow Rock', 'skill', null, 'core'),
    ('Hollow Hold', 'skill', null, 'core'),
    ('Arch Rock', 'skill', null, 'core'),
    ('Plank', 'skill', null, 'core'),
    ('GHD Hip Extension', 'skill', null, 'posterior'),
    ('Back Extension', 'skill', null, 'posterior'),
    ('Pike Push-Up', 'skill', 'press', 'gymnastics'),
    ('Deficit HSPU', 'skill', 'press', 'gymnastics'),
    ('Parallette HSPU', 'skill', 'press', 'gymnastics'),
    ('Ring Push-Up', 'skill', 'press', 'gymnastics'),
    ('Triple Under', 'skill', null, 'conditioning'),
    ('Broad Jump', 'skill', 'squat', 'plyometric'),
    ('Tuck Jump', 'skill', 'squat', 'plyometric'),
    ('Jumping Lunge', 'skill', 'squat', 'plyometric'),
    ('Bear Crawl', 'skill', null, 'conditioning'),
    ('Burpee Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Burpee Box Get-Over', 'skill', 'squat', 'gymnastics'),
    ('Mountain Climbers', 'skill', null, 'conditioning'),
    ('Banded Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Dead Hang', 'skill', 'pull', 'gymnastics'),
    ('Active Hang', 'skill', 'pull', 'gymnastics'),
    ('Wall-Facing Handstand Hold', 'skill', 'press', 'gymnastics'),
    ('Lateral Box Jump Over', 'skill', 'squat', 'gymnastics'),
    ('Seated Box Jump', 'skill', 'squat', 'gymnastics'),
    ('Flutter Kicks', 'skill', null, 'core'),
    ('Russian Twist', 'skill', null, 'core'),
    ('Hanging Knee Raise', 'skill', 'pull', 'core'),
    ('Skin the Cat', 'skill', 'pull', 'gymnastics'),
    ('Ring Support Hold', 'skill', 'press', 'gymnastics'),
    ('Pegboard Ascent', 'skill', 'pull', 'gymnastics')
) as v(name, stimulus, sub_stimulus, purpose_variation)
where not exists (
  select 1
  from public.benchmark_type bt
  where lower(bt.name) = lower(v.name)
    and bt.gym_id is null
);

insert into public.benchmark_definition (benchmark_type_id, rep_count)
select bt.id, r.rep_count
from public.benchmark_type bt
cross join (values (1), (2), (3), (5), (10)) as r(rep_count)
where bt.gym_id is null
  and bt.stimulus = 'strength'
  and bt.name in (
    'Goblet Squat',
    'Dumbbell Front Squat',
    'Dumbbell Squat',
    'Dumbbell Deadlift',
    'Dumbbell Push Press',
    'Dumbbell Push Jerk',
    'Dumbbell Clean & Jerk',
    'Alternating Dumbbell Snatch',
    'Double Dumbbell Snatch',
    'Shoulder to Overhead',
    'Ground to Overhead',
    'Walking Lunge',
    'Reverse Lunge',
    'Front Rack Lunge',
    'Overhead Lunge',
    'Bulgarian Split Squat',
    'Good Morning',
    'Barbell Row',
    'Pendlay Row',
    'Kettlebell Clean',
    'Kettlebell Snatch',
    'Kettlebell Thruster',
    'Kettlebell Deadlift',
    'Turkish Get-Up',
    'Sandbag Clean',
    'Sandbag Carry',
    'D-ball Clean',
    'D-ball Over Shoulder',
    'Slam Ball',
    'Suitcase Carry',
    'Overhead Carry',
    'Pause Front Squat',
    'Tempo Back Squat',
    'Deficit Deadlift',
    'Rack Pull',
    'Floor Press',
    'Close-Grip Bench',
    'Hip Thrust',
    'Glute Bridge',
    'Renegade Row',
    'Man Maker',
    'Behind-the-Neck Push Press',
    'Behind-the-Neck Jerk',
    'Plate Ground-to-Overhead'
  )
  and not exists (
    select 1
    from public.benchmark_definition bd
    where bd.benchmark_type_id = bt.id
      and bd.rep_count = r.rep_count
  );
