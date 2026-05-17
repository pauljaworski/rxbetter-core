/**
 * Import Triad Workout Trends → programming, line items, and Paul's results
 * Source: Downloads xlsx, sheet "3-16--tbd Cycle"
 */
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const XLSX_PATH = 'C:/Users/paulj/Downloads/Triad Workout Trends (1).xlsx';
const SHEET = '3-16--tbd Cycle';

const GYM = 'a0000000-0000-4000-8000-000000000001';
const LIB = '10000000-0000-4000-8000-000000000001';
const PAUL = 'c0000000-0000-4000-8000-000000000001';
const YEAR = 2026;
const DELETE_FROM = '2026-03-16';
const DELETE_TO = '2026-06-30';

/** Longest-first lift names for prefix matching */
const LIFT_NAMES = [
  'Hang Power Snatch',
  'Hang Power Clean',
  'Hang Squat Clean',
  'Power Clean & Push Jerk',
  'Clean & Jerk',
  'Front Rack Lunges',
  'Back Rack Lunges',
  'Overhead Lunge',
  'Overhead Squat',
  'Front Squat',
  'Back Squat',
  'Bench Press',
  'Strict Press',
  'Push Press',
  'Push Jerk',
  'Split Jerk',
  'Power Snatch',
  'Power Clean',
  'Hang Snatch',
  'Hang Clean',
  'Muscle Snatch',
  'Deadlift',
  'Thruster',
  'Snatch',
  'Clean',
];

const LIFT_TO_BENCHMARK = {
  'Hang Squat Clean': 'Hang Clean',
};

const METCON_BENCHMARKS = [
  'Fran',
  'Grace',
  'Helen',
  'Diane',
  'Elizabeth',
  'Isabel',
  'Annie',
  'Murph',
  'DT',
  'Cindy',
  'Jackie',
  'Karen',
  'Nancy',
  'Amanda',
];

let pliCounter = 1;

function sqlStr(s) {
  if (s == null || s === '') return 'null';
  return `'${String(s).replace(/'/g, "''").replace(/"/g, '')}'`;
}

function makePliId() {
  return `f3000000-0000-4000-8000-${String(pliCounter++).padStart(12, '0')}`;
}

function btSubquery(liftName) {
  if (!liftName) return 'null';
  return `(select id from public.benchmark_type where name = ${sqlStr(liftName)})`;
}

function bdSubquery(liftName, repCount) {
  if (!liftName || !repCount) return 'null';
  return `(select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = ${sqlStr(liftName)} and bd.rep_count = ${repCount})`;
}

/** Parse full CSV text including multiline quoted fields. */
function parseCsvRecords(raw) {
  const records = [];
  let row = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQ && raw[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQ = !inQ;
      continue;
    }
    if (c === ',' && !inQ) {
      row.push(cur.trim());
      cur = '';
      continue;
    }
    if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && raw[i + 1] === '\n') i++;
      row.push(cur.trim());
      if (row.some((cell) => cell !== '')) records.push(row);
      row = [];
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some((cell) => cell !== '')) records.push(row);
  }
  return records;
}

function parseDate(cell) {
  if (!cell || cell === 'Date') return null;
  const m = String(cell).match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const [, mo, da] = m;
  return `${YEAR}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
}

function isNA(v) {
  if (v == null) return true;
  const s = String(v).trim().toUpperCase();
  return s === 'N/A' || s === '' || s === '-';
}

function parseWorkoutScale(v) {
  if (isNA(v)) return null;
  const s = String(v).trim().toLowerCase().replace(/\s+/g, '');
  if (s === 'rx+' || s === 'rxplus') return 'rx_plus';
  if (s === 'rx') return 'rx';
  if (s === 'fx') return 'fx';
  if (s === 'scaled') return 'scaled';
  return null;
}

function inferMetconFormat(metcon) {
  const t = metcon.toUpperCase();
  if (/\bAMRAP\b/.test(t)) return 'amrap';
  if (/\bEMOM\b/.test(t)) return 'emom';
  if (/\bRFT\b|\bFOR TIME\b|\bEVERY\b|\bROUNDS?\b/.test(t)) return 'for_time';
  return 'for_time';
}

function strengthTitle(raw) {
  return String(raw).slice(0, 120);
}

function metconTitle(raw) {
  const s = String(raw).trim();
  const short = s.split(':')[0].slice(0, 80);
  return short.length > 5 ? short : s.slice(0, 80);
}

function detectLift(text) {
  const raw = String(text).trim();
  for (const name of LIFT_NAMES) {
    if (raw.toLowerCase().startsWith(name.toLowerCase())) {
      return LIFT_TO_BENCHMARK[name] || name;
    }
  }
  return null;
}

function detectMetconBenchmark(text) {
  const raw = String(text).trim();
  for (const name of METCON_BENCHMARKS) {
    if (raw === name || raw.startsWith(name + ' ') || raw.startsWith(name + ':')) {
      return name;
    }
  }
  return null;
}

function parsePercentageList(parenInner, setCount) {
  const s = parenInner.replace(/[()]/g, '').trim();
  if (!s) return [];

  const range = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%?/);
  if (range && !s.includes(',')) {
    const lo = parseFloat(range[1]) / 100;
    const hi = parseFloat(range[2]) / 100;
    if (setCount <= 1) return [hi];
    return Array.from({ length: setCount }, (_, i) => lo + ((hi - lo) * i) / (setCount - 1));
  }

  const parts = s
    .split(',')
    .map((x) => parseFloat(x.replace('%', '').trim()) / 100)
    .filter((n) => Number.isFinite(n));
  if (parts.length === 0) return [];
  while (parts.length < setCount) parts.push(parts[parts.length - 1]);
  return parts.slice(0, setCount);
}

function parseStrengthPrescription(text) {
  const raw = String(text).trim();
  const lift = detectLift(raw);

  const setsRepsMatch = raw.match(/(\d+)\s*[xX×]\s*(\d+)/);
  let setCount = 1;
  let reps = 1;
  if (setsRepsMatch) {
    setCount = parseInt(setsRepsMatch[1], 10);
    reps = parseInt(setsRepsMatch[2], 10);
  }

  const pctGroups = raw.match(/\([^)]*\d+[^)]*\)/g) || [];
  const pctGroup = pctGroups.find((g) => /%/.test(g) || /\d+\s*-\s*\d+/.test(g));
  let percentages = pctGroup ? parsePercentageList(pctGroup, setCount) : [];

  if (setCount === 1 && percentages.length === 0) {
    return {
      lift,
      sets: [{ sequence: 1, reps: null, pct: null, fallbackScore: raw }],
    };
  }

  if (percentages.length === 0 && setCount > 1) {
    percentages = Array(setCount).fill(null);
  }

  const sets = [];
  for (let i = 0; i < setCount; i++) {
    sets.push({
      sequence: i + 1,
      reps,
      pct: percentages[i] ?? percentages[percentages.length - 1] ?? null,
    });
  }
  return { lift, sets };
}

function parseScoreToSeconds(score) {
  if (!score || isNA(score)) return null;
  const s = String(score).trim();
  if (/round/i.test(s) && !/^\d+:\d+/.test(s)) return null;
  const hm = s.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (hm) {
    if (hm[3]) return +hm[1] * 3600 + +hm[2] * 60 + +hm[3];
    return +hm[1] * 60 + +hm[2];
  }
  return null;
}

function parseStrengthOutcome(raw) {
  if (isNA(raw)) return null;
  const s = String(raw).trim();
  if (/^completed$/i.test(s)) return { status: 'completed', weight: null, score: 'Completed' };
  if (/fail/i.test(s)) return { status: 'failed', weight: null, score: s };
  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (Number.isFinite(num) && num > 0) {
    return { status: 'completed', weight: num, score: String(num) };
  }
  return { status: 'completed', weight: null, score: s };
}

function insertStrengthLineItems(sql, progId, prescription) {
  const pliIds = [];
  const { lift, sets } = prescription;

  for (const set of sets) {
    const pliId = makePliId();
    pliIds.push({ pliId, ...set, lift });

    if (set.fallbackScore) {
      sql.push(`insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('${pliId}', '${progId}', ${set.sequence}, ${sqlStr(set.fallbackScore)}, 'pending');`);
      continue;
    }

    const pct = set.pct != null ? set.pct : 'null';
    const reps = set.reps != null ? set.reps : 'null';
    sql.push(`insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, reps_prescribed, prescribed_percentage, status)
values ('${pliId}', '${progId}', ${btSubquery(lift)}, ${set.sequence}, ${reps}, ${pct}, 'pending');`);
  }
  return pliIds;
}

function insertMetconLineItem(sql, progId, metconText) {
  const pliId = makePliId();
  const benchmark = detectMetconBenchmark(metconText);
  const bt = benchmark ? btSubquery(benchmark) : 'null';
  sql.push(`insert into public.programming_line_item (id, programming_id, benchmark_type_id, sequence_number, prescribed_score, status)
values ('${pliId}', '${progId}', ${bt}, 1, ${sqlStr(metconText)}, 'pending');`);
  return pliId;
}

const raw = execSync(`npx --yes xlsx-cli "${XLSX_PATH}" --sheet "${SHEET}"`, {
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024,
});

const records = parseCsvRecords(raw).filter((r) => r[0] !== 'Date' && !/^3-16--tbd/i.test(r[0] || ''));

const rows = [];
for (const cols of records) {
  if (cols.length < 4) continue;
  const iso = parseDate(cols[0]);
  if (!iso) continue;
  const strength = cols[2] ?? '';
  const strengthWeight = cols[3] ?? '';
  const metcon = cols[4] ?? '';
  const metconScore = cols[5] ?? '';
  const rxScaled = cols[6] ?? '';
  if (isNA(strength) && isNA(metcon)) continue;
  rows.push({ iso, day: cols[1], strength, strengthWeight, metcon, metconScore, rxScaled });
}

const sql = [];
sql.push('-- Triad Workout Trends: programming + line items + Paul performances');
sql.push('alter table public.programming disable trigger programming_update_guard;');
sql.push('alter table public.programming_line_item disable trigger pli_update_guard;');
sql.push('');
sql.push(`delete from public.athlete_performance where programming_id in (
  select id from public.programming where gym_id = '${GYM}' and wod_date >= '${DELETE_FROM}' and wod_date <= '${DELETE_TO}'
);`);
sql.push(`delete from public.programming_line_item where programming_id in (
  select id from public.programming where gym_id = '${GYM}' and wod_date >= '${DELETE_FROM}' and wod_date <= '${DELETE_TO}'
);`);
sql.push(`delete from public.programming where gym_id = '${GYM}' and wod_date >= '${DELETE_FROM}' and wod_date <= '${DELETE_TO}';`);
sql.push('');

let pliCount = 0;
let perfCount = 0;

for (const r of rows) {
  const dateKey = r.iso.replace(/-/g, '');
  let order = 1;
  const makeProgId = (ord) =>
    `e3000000-0000-4000-8000-${dateKey}${String(ord).padStart(4, '0')}`;
  const scale = parseWorkoutScale(r.rxScaled);

  if (!isNA(r.strength)) {
    const progId = makeProgId(order);
    const name = strengthTitle(r.strength);
    const prescription = parseStrengthPrescription(r.strength);

    sql.push(`insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('${progId}', '${GYM}', '${LIB}', ${sqlStr(name)}, ${sqlStr(r.iso)}, 'weightlifting', 'rx', ${order}, ${sqlStr(r.strength)}, 'gym');`);

    const pliIds = insertStrengthLineItems(sql, progId, prescription);
    pliCount += pliIds.length;

    const outcome = parseStrengthOutcome(r.strengthWeight);
    if (outcome && pliIds.length > 0) {
      const target = pliIds[pliIds.length - 1];
      const wl = outcome.weight != null ? outcome.weight : 'null';
      const reps = target.reps != null ? target.reps : 'null';
      const pct = target.pct != null ? target.pct : 'null';
      const bd =
        target.lift && target.reps
          ? bdSubquery(target.lift, target.reps)
          : target.lift
            ? bdSubquery(target.lift, 1)
            : 'null';

      sql.push(`insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, benchmark_definition_id, performance_date, status, score, weight_lifted, reps_prescribed, prescribed_percentage, is_pr)
values ('${PAUL}', '${progId}', '${target.pliId}', ${btSubquery(target.lift)}, ${bd}, ${sqlStr(r.iso)}, '${outcome.status}', ${sqlStr(outcome.score)}, ${wl}, ${reps}, ${pct}, false);`);
      perfCount++;
    }
    order++;
  }

  if (!isNA(r.metcon)) {
    const progId = makeProgId(order);
    const name = metconTitle(r.metcon);
    const fmt = inferMetconFormat(r.metcon);

    sql.push(`insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('${progId}', '${GYM}', '${LIB}', ${sqlStr(name)}, ${sqlStr(r.iso)}, 'metcon', ${sqlStr(fmt)}, 'rx', ${order}, ${sqlStr(r.metcon)}, 'gym');`);

    const pliId = insertMetconLineItem(sql, progId, r.metcon);
    pliCount++;

    if (!isNA(r.metconScore)) {
      const score = String(r.metconScore).trim();
      const rv = parseScoreToSeconds(score);
      const scaleSql = scale ? `'${scale}'` : 'null';
      const benchmark = detectMetconBenchmark(r.metcon);

      sql.push(`insert into public.athlete_performance (contact_id, programming_id, programming_line_item_id, benchmark_type_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('${PAUL}', '${progId}', '${pliId}', ${benchmark ? btSubquery(benchmark) : 'null'}, ${sqlStr(r.iso)}, 'completed', ${sqlStr(score)}, ${rv ?? 'null'}, ${scaleSql}, false);`);
      perfCount++;
    }
    order++;
  }
}

sql.push('');
sql.push('alter table public.programming enable trigger programming_update_guard;');
sql.push('alter table public.programming_line_item enable trigger pli_update_guard;');

const outPath = join(dirname(fileURLToPath(import.meta.url)), '../supabase/remote/04_triad_workout_trends.sql');
writeFileSync(outPath, sql.join('\n'));

console.log('Wrote', outPath);
console.log('Days:', rows.length);
console.log('Line items:', pliCount);
console.log('Performances:', perfCount);
console.log('From', rows[0]?.iso, 'to', rows[rows.length - 1]?.iso);
