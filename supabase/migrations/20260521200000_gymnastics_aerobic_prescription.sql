-- Gymnastics + aerobic movements for metcon programming; prescription unit on line items

alter table public.programming_line_item
  add column if not exists prescription_unit text
    check (
      prescription_unit is null
      or prescription_unit in ('reps', 'meters', 'calories', 'feet')
    );

comment on column public.programming_line_item.prescription_unit is
  'How reps_prescribed is interpreted: reps, meters, calories, or feet.';

insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation)
select v.name, v.stimulus, v.sub_stimulus, v.purpose_variation
from (
  values
    -- Gymnastics
    ('Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Strict Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Kipping Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Chest-to-Bar Pull-Up', 'skill', 'pull', 'gymnastics'),
    ('Chest-to-Bar', 'skill', 'pull', 'gymnastics'),
    ('Ring Row', 'skill', 'pull', 'gymnastics'),
    ('Push-Up', 'skill', 'press', 'gymnastics'),
    ('Hand Release Push-Up', 'skill', 'press', 'gymnastics'),
    ('Ring Dip', 'skill', 'press', 'gymnastics'),
    ('Bar Dip', 'skill', 'press', 'gymnastics'),
    ('Ring Muscle-Up', 'skill', 'pull', 'gymnastics'),
    ('Strict Muscle-Up', 'skill', 'pull', 'gymnastics'),
    ('Strict Handstand Push-Up', 'skill', 'press', 'gymnastics'),
    ('Kipping Handstand Push-Up', 'skill', 'press', 'gymnastics'),
    ('Handstand Hold', 'skill', 'press', 'gymnastics'),
    ('Wall Walk', 'skill', 'press', 'gymnastics'),
    ('Sit-Up', 'skill', null, 'gymnastics'),
    ('GHD Sit-Up', 'skill', null, 'gymnastics'),
    ('AbMat Sit-Up', 'skill', null, 'gymnastics'),
    ('V-Up', 'skill', null, 'gymnastics'),
    ('L-Sit', 'skill', null, 'gymnastics'),
    ('Pistol', 'skill', 'squat', 'gymnastics'),
    ('Burpee', 'skill', null, 'gymnastics'),
    ('Bar-Facing Burpee', 'skill', null, 'gymnastics'),
    ('Burpee Box Jump Over', 'skill', null, 'gymnastics'),
    ('Box Jump', 'skill', 'squat', 'gymnastics'),
    ('Box Jump Over', 'skill', 'squat', 'gymnastics'),
    ('Box Step-Up', 'skill', 'squat', 'gymnastics'),
    ('Wall Ball', 'strength', 'squat', 'wall ball'),
    ('Wall Balls', 'strength', 'squat', 'wall ball'),
    ('Rope Climb', 'skill', 'pull', 'gymnastics'),
    ('Legless Rope Climb', 'skill', 'pull', 'gymnastics'),
    ('Single Under', 'skill', null, 'conditioning'),
    ('Double Under', 'skill', null, 'conditioning'),
    ('Toes to Bar', 'skill', 'pull', 'gymnastics'),
    -- Aerobic / monostructural
    ('Run', 'skill', 'mono', 'aerobic'),
    ('Row', 'skill', 'mono', 'aerobic'),
    ('Row Calories', 'skill', 'mono', 'aerobic'),
    ('Ski Erg', 'skill', 'mono', 'aerobic'),
    ('Assault Bike', 'skill', 'mono', 'aerobic'),
    ('Echo Bike', 'skill', 'mono', 'aerobic'),
    ('Bike Erg', 'skill', 'mono', 'aerobic'),
    ('Air Bike Calories', 'skill', 'mono', 'aerobic'),
    ('Farmer Carry', 'skill', 'mono', 'carry'),
    ('Sled Push', 'skill', 'mono', 'sled'),
    ('Sled Pull', 'skill', 'mono', 'sled'),
    ('Shuttle Run', 'skill', 'mono', 'aerobic'),
    ('Jump Rope', 'skill', null, 'conditioning'),
    -- Common metcon strength movements
    ('Kettlebell Swing', 'strength', 'pull', 'kettlebell'),
    ('American Kettlebell Swing', 'strength', 'pull', 'kettlebell'),
    ('Russian Kettlebell Swing', 'strength', 'pull', 'kettlebell'),
    ('Dumbbell Snatch', 'strength', 'snatch', 'dumbbell'),
    ('Dumbbell Clean', 'strength', 'clean', 'dumbbell'),
    ('Dumbbell Thruster', 'strength', 'combined', 'dumbbell'),
    ('Devil Press', 'strength', 'combined', 'dumbbell'),
    ('Sumo Deadlift High Pull', 'strength', 'pull', 'variation'),
    ('Medicine Ball Clean', 'strength', 'clean', 'medicine ball')
) as v(name, stimulus, sub_stimulus, purpose_variation)
where not exists (
  select 1 from public.benchmark_type bt where lower(bt.name) = lower(v.name)
);
