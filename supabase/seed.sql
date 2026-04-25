-- ============================================================
-- RxBetter seed data: benchmark_type + benchmark_definition
-- ============================================================

-- Strength — Squat variations
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Back Squat',        'strength', 'squat',    null),
  ('Front Squat',       'strength', 'squat',    null),
  ('Overhead Squat',    'strength', 'squat',    null),
  ('Zercher Squat',     'strength', 'squat',    'variation'),
  ('Pistol Squat',      'skill',    'squat',    'single leg');

-- Strength — Pull variations
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Deadlift',          'strength', 'pull',     null),
  ('Sumo Deadlift',     'strength', 'pull',     'variation'),
  ('Romanian Deadlift', 'strength', 'pull',     'variation');

-- Strength — Clean variations
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Clean',             'strength', 'clean',    null),
  ('Power Clean',       'strength', 'clean',    'power'),
  ('Hang Clean',        'strength', 'clean',    'hang'),
  ('Hang Power Clean',  'strength', 'clean',    'hang power'),
  ('Squat Clean',       'strength', 'clean',    'squat');

-- Strength — Snatch variations
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Snatch',            'strength', 'snatch',   null),
  ('Power Snatch',      'strength', 'snatch',   'power'),
  ('Hang Snatch',       'strength', 'snatch',   'hang'),
  ('Hang Power Snatch', 'strength', 'snatch',   'hang power'),
  ('Squat Snatch',      'strength', 'snatch',   'squat');

-- Strength — Jerk variations
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Jerk',              'strength', 'jerk',     null),
  ('Push Jerk',         'strength', 'jerk',     'push'),
  ('Split Jerk',        'strength', 'jerk',     'split');

-- Strength — Combined
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Clean & Jerk',      'strength', 'combined', null);

-- Strength — Press variations
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Strict Press',       'strength', 'press',   null),
  ('Push Press',         'strength', 'press',   'push'),
  ('Bench Press',        'strength', 'press',   'bench'),
  ('Incline Bench Press','strength', 'press',   'incline'),
  ('Dumbbell Press',     'strength', 'press',   'dumbbell');

-- Strength — Other
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Thruster',          'strength', 'combined', null),
  ('Cluster',           'strength', 'combined', 'clean + thruster'),
  ('Weighted Pull-Up',  'strength', 'pull',     'weighted'),
  ('Weighted Dip',      'strength', 'press',    'weighted');

-- Metcons — Girls / Hero / Classic
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Fran',        'metcon', null, '21-15-9 Thrusters & Pull-Ups'),
  ('Grace',       'metcon', null, '30 Clean & Jerks for time'),
  ('Isabel',      'metcon', null, '30 Snatches for time'),
  ('Diane',       'metcon', null, '21-15-9 Deadlifts & HSPU'),
  ('Helen',       'metcon', null, '3 RFT: 400m Run, 21 KBS, 12 Pull-Ups'),
  ('Jackie',      'metcon', null, '1000m Row, 50 Thrusters, 30 Pull-Ups'),
  ('Karen',       'metcon', null, '150 Wall Balls for time'),
  ('Cindy',       'metcon', null, '20min AMRAP: 5 Pull-Ups, 10 Push-Ups, 15 Squats'),
  ('Annie',       'metcon', null, '50-40-30-20-10 DU & Sit-Ups'),
  ('Murph',       'metcon', null, '1mi Run, 100 Pull-Ups, 200 Push-Ups, 300 Squats, 1mi Run'),
  ('DT',          'metcon', null, '5 RFT: 12 DL, 9 Hang PC, 6 Push Jerk'),
  ('Chelsea',     'metcon', null, 'EMOM 30: 5 Pull-Ups, 10 Push-Ups, 15 Squats'),
  ('Elizabeth',   'metcon', null, '21-15-9 Cleans & Ring Dips'),
  ('Nancy',       'metcon', null, '5 RFT: 400m Run, 15 OHS'),
  ('Kelly',       'metcon', null, '5 RFT: 400m Run, 30 Box Jumps, 30 Wall Balls'),
  ('Angie',       'metcon', null, '100 Pull-Ups, 100 Push-Ups, 100 Sit-Ups, 100 Squats'),
  ('Barbara',     'metcon', null, '5 RFT: 20 Pull-Ups, 30 Push-Ups, 40 Sit-Ups, 50 Squats'),
  ('Linda',       'metcon', null, '10-9-8...1 DL, Bench, Clean (BW ratios)'),
  ('Mary',        'metcon', null, '20min AMRAP: 5 HSPU, 10 Pistols, 15 Pull-Ups'),
  ('Amanda',      'metcon', null, '9-7-5 Muscle-Ups & Snatches'),
  ('Filthy Fifty','metcon', null, '50 reps each of 10 movements');

-- Skill movements
insert into public.benchmark_type (name, stimulus, sub_stimulus, purpose_variation) values
  ('Muscle-Up',         'skill', 'pull',  'gymnastics'),
  ('Bar Muscle-Up',     'skill', 'pull',  'gymnastics'),
  ('Handstand Walk',    'skill', 'press', 'gymnastics'),
  ('Handstand Push-Up', 'skill', 'press', 'gymnastics'),
  ('Rope Climb',        'skill', 'pull',  'gymnastics'),
  ('Double Under',      'skill', null,    'conditioning'),
  ('Toes-to-Bar',       'skill', 'pull',  'gymnastics');

-- ============================================================
-- Benchmark Definitions — 1RM, 2RM, 3RM, 5RM, 10RM for all strength types
-- ============================================================
insert into public.benchmark_definition (benchmark_type_id, rep_count)
select bt.id, r.rep_count
from public.benchmark_type bt
cross join (values (1),(2),(3),(5),(10)) as r(rep_count)
where bt.stimulus = 'strength';
