/**
 * Build SQL from Paul Crossfit Tracker + SugarWod exports.
 * Sources:
 *   - Downloads/Paul Crossfit Tracker.xlsx (CrossFit Stats tab — yearly 1RMs)
 *   - Google Drive: CrossFit Max Lifts Export SugarWod.xlsx (Raw Data)
 *   - Google Drive: SugarWod Workouts.csv
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const PAUL = 'c0000000-0000-4000-8000-000000000001';

const BASE =
  'G:/.shortcut-targets-by-id/11Xq6cUUOFH_u3AJCtHkZPyMoSf1HgdCS/The Jaworskis/Fitness & Health';
const XLSX = `${BASE}/Stats/CrossFit Max Lifts Export SugarWod.xlsx`;
const CSV = `${BASE}/SugarWod Workouts.csv`;
const TRACKER_XLSX = 'C:/Users/paulj/Downloads/Paul Crossfit Tracker.xlsx';
const CROSSFIT_STATS_SHEET = 'CrossFit Stats';

// Map SugarWod / export lift names -> seed benchmark_type.name
const LIFT_MAP = {
  'Back Squat': 'Back Squat',
  'Front Squat': 'Front Squat',
  'Overhead Squat': 'Overhead Squat',
  'Deadlift': 'Deadlift',
  'Sumo Deadlift': 'Sumo Deadlift',
  'Romanian Deadlift': 'Romanian Deadlift',
  Snatch: 'Snatch',
  'Power Snatch': 'Power Snatch',
  'Hang Power Snatch': 'Hang Power Snatch',
  'Squat Snatch': 'Snatch',
  Clean: 'Clean',
  'Power Clean': 'Power Clean',
  'Hang Clean': 'Hang Clean',
  'Hang Power Clean': 'Hang Power Clean',
  'Squat Clean': 'Clean',
  'Clean & Jerk': 'Clean & Jerk',
  'Power Clean & Jerk': 'Clean & Jerk',
  'Split Jerk': 'Jerk',
  'Push Jerk': 'Push Jerk',
  'Push Press': 'Push Press',
  'Strict Press': 'Strict Press',
  'Shoulder Press': 'Strict Press',
  'Bench Press': 'Bench Press',
  Thruster: 'Thruster',
  'Weighted Pull-Up': 'Weighted Pull-Up',
  'Weighted Dip': 'Weighted Dip',
};

const METCON_MAP = {
  Fran: 'Fran',
  Grace: 'Grace',
  Helen: 'Helen',
  Diane: 'Diane',
  Elizabeth: 'Elizabeth',
  Isabel: 'Isabel',
  Annie: 'Annie',
  Murph: 'Murph',
  DT: 'DT',
  Cindy: 'Cindy',
  Jackie: 'Jackie',
  Karen: 'Karen',
  Nancy: 'Nancy',
  Amanda: 'Amanda',
  'Filthy Fifty': 'Filthy Fifty',
};

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function parseDateMDY(s) {
  const [mo, da, yr] = s.split('/');
  return `${yr}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`;
}

function sqlStr(s) {
  return s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
}

function parseNum(s) {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

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

/** CrossFit Stats tab: lift name -> benchmark_type.name (seed.sql) */
const STATS_LIFT_MAP = {
  'Power Snatch': 'Power Snatch',
  Snatch: 'Snatch',
  'Hang Power Snatch': 'Hang Power Snatch',
  'Hang Snatch': 'Hang Snatch',
  'Power Clean': 'Power Clean',
  Clean: 'Clean',
  'Hang Power Clean': 'Hang Power Clean',
  'Hang Squat Clean': 'Hang Clean',
  'Clean & Jerk': 'Clean & Jerk',
  'Push Jerk': 'Push Jerk',
  'Split Jerk': 'Split Jerk',
  'Back Squat': 'Back Squat',
  'Front Squat': 'Front Squat',
  'Overhead Squat': 'Overhead Squat',
  'Bench Press': 'Bench Press',
  'Push Press': 'Push Press',
  'Strict Press': 'Strict Press',
  Deadlift: 'Deadlift',
  Thruster: 'Thruster',
};

function parseYearFromHeader(h) {
  const m = String(h || '').match(/(20\d{2})/);
  return m ? parseInt(m[1], 10) : null;
}

function isStatsSkipRow(name) {
  if (!name) return true;
  if (/totals?$/i.test(name)) return true;
  if (/^(Snatches|Cleans|Jerks|Squats|Presses|Deadlifts|Other|Powerlifting|Gymnastics|Endurance|Heroes)/i.test(name)) {
    return true;
  }
  if (/^Total\b/i.test(name)) return true;
  if (name.includes('Hero') || name.includes('Girl')) return true;
  return false;
}

// --- Parse Max Lifts xlsx via xlsx-cli CSV output ---
const xlsxRaw = execSync(`npx --yes xlsx-cli "${XLSX}"`, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const xlsxLines = xlsxRaw.split(/\r?\n/).slice(1); // skip "Raw Data" title if present
const prRows = [];
for (const line of xlsxLines) {
  if (!line.trim() || line.startsWith('PR /')) continue;
  const cols = parseCsvLine(line);
  if (cols.length < 5) continue;
  const [workout, category, dateStr, , result] = cols;
  if (!workout || !result) continue;
  let isoDate = null;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d)) isoDate = d.toISOString().slice(0, 10);
  } catch {
    /* ignore */
  }
  prRows.push({ workout: workout.trim(), category: category?.trim(), date: isoDate, result: result.trim() });
}

const strengthPrs = {}; // benchmarkName -> { weight, date }
const metconPrs = {}; // benchmarkName -> { score, result_value, date }
const oneRmHistory = []; // yearly 1RM rows from CrossFit Stats

function upsertStrength(bt, weight, date) {
  if (!weight || !bt) return;
  const prev = strengthPrs[bt];
  if (!prev || weight > prev.weight || (weight === prev.weight && date > prev.date)) {
    strengthPrs[bt] = { weight, date: date || '2020-01-01' };
  }
}

function upsertMetcon(bt, score, resultValue, date) {
  if (!bt || resultValue == null) return;
  const prev = metconPrs[bt];
  // for time: lower seconds is better
  const better = !prev || resultValue < prev.result_value;
  if (better) metconPrs[bt] = { score, result_value: resultValue, date: date || '2020-01-01' };
}

for (const row of prRows) {
  const w = row.workout;
  const res = row.result;
  const num = parseNum(res);
  if (num == null) continue;
  const cat = row.category || '';

  for (const [key, bt] of Object.entries(LIFT_MAP)) {
    // avoid Snatch matching Snatch Pull / Snatch Balance etc.
    if (key === 'Snatch' && !/^Snatch(\s|$)/i.test(w) && w !== 'Snatch') continue;
    if (key === 'Clean' && /\bClean Pull\b|\bHang Clean\b|\bPower Clean\b/i.test(w)) continue;
    if (!w.includes(key)) continue;
    if (cat === 'Benchmark') continue;
    // lifts + complex lifts: track best load
    if (cat === 'Lift' || cat === 'Complex Lift' || /1x1|5x1|9x1|7x1|10x1|1 RM|1RM|for load/i.test(w)) {
      upsertStrength(bt, num, row.date);
    }
  }

  for (const [key, bt] of Object.entries(METCON_MAP)) {
    if (w === key || w.startsWith(key + ' (') || w.startsWith(key + ' ')) {
      if (cat === 'Benchmark' || cat === '') upsertMetcon(bt, res, num, row.date);
    }
  }
}

// Manual overrides from latest SugarWod CSV entries (newer than export)
const csvText = readFileSync(CSV, 'utf8');
const csvLines = csvText.split(/\r?\n/).slice(1);
const workouts2026 = [];

for (const line of csvLines) {
  if (!line.trim()) continue;
  const cols = parseCsvLine(line);
  if (cols.length < 6) continue;
  const [date, title, , bestRaw, bestDisplay, scoreType, barbellLift] = cols;
  if (!date?.includes('2026')) continue;
  const iso = parseDateMDY(date);
  workouts2026.push({
    date: iso,
    title: title?.trim(),
    scoreType: scoreType?.trim(),
    barbellLift: barbellLift?.trim(),
    bestRaw,
    bestDisplay: bestDisplay?.trim(),
  });

  if (scoreType === 'Load' && barbellLift && LIFT_MAP[barbellLift]) {
    const bt = LIFT_MAP[barbellLift];
    const num = parseNum(bestRaw);
    if (num) upsertStrength(bt, num, iso);
  }
  if (scoreType !== 'Load' && METCON_MAP[title]) {
    const num = parseNum(bestRaw);
    if (num) upsertMetcon(METCON_MAP[title], bestDisplay || bestRaw, num, iso);
  }
}

// Known latest PRs from SugarWod tail (override export lag)
const manualLatest = {
  'Back Squat': { weight: 425, date: '2025-11-04' },
  Snatch: { weight: 225, date: '2023-09-11' },
  Clean: { weight: 350, date: '2025-12-03' },
  'Clean & Jerk': { weight: 305, date: '2025-12-18' },
  Deadlift: { weight: 505, date: '2024-11-08' },
  'Front Squat': { weight: 360, date: '2025-05-27' },
  'Bench Press': { weight: 270, date: '2024-09-03' },
  'Strict Press': { weight: 205, date: '2024-11-11' },
  'Overhead Squat': { weight: 265, date: '2024-11-01' },
  'Power Snatch': { weight: 220, date: '2023-09-11' },
  'Power Clean': { weight: 315, date: '2025-01-28' },
  'Push Press': { weight: 295, date: '2025-09-08' },
  Thruster: { weight: 275, date: '2024-08-29' },
  'Hang Power Clean': { weight: 285, date: '2024-12-04' },
};
for (const [bt, v] of Object.entries(manualLatest)) upsertStrength(bt, v.weight, v.date);

const manualMetcons = {
  Fran: { score: '2:27', result_value: 147, date: '2021-10-14' },
  Grace: { score: '1:38', result_value: 98, date: '2022-07-12' },
  Helen: { score: '7:03', result_value: 423, date: '2021-05-03' },
  Diane: { score: '2:26', result_value: 146, date: '2021-01-19' },
  Elizabeth: { score: '2:53', result_value: 173, date: '2021-05-12' },
  Isabel: { score: '2:46', result_value: 166, date: '2022-08-05' },
  Annie: { score: '6:45', result_value: 405, date: '2026-04-16' },
  Murph: { score: '42:18', result_value: 2538, date: '2026-05-09' },
  DT: { score: '12:45', result_value: 765, date: '2025-08-22' },
  Cindy: { score: '26+23', result_value: 26, date: '2020-11-04' },
  Jackie: { score: '5:46', result_value: 346, date: '2020-09-18' },
  Amanda: { score: '4:15', result_value: 255, date: '2022-02-08' },
};
for (const [bt, v] of Object.entries(manualMetcons)) upsertMetcon(bt, v.score, v.result_value, v.date);

// --- Paul Crossfit Tracker: CrossFit Stats tab (yearly 1RM achievements) ---
const statsRaw = execSync(
  `npx --yes xlsx-cli "${TRACKER_XLSX}" --sheet "${CROSSFIT_STATS_SHEET}"`,
  { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
);
const statsRecords = parseCsvRecords(statsRaw);
const headerIdx = statsRecords.findIndex((r) =>
  String(r[0] || '').toLowerCase().includes('1rm'),
);
if (headerIdx >= 0) {
  const headerRow = statsRecords[headerIdx];
  const yearCols = [];
  for (let i = 1; i < headerRow.length; i++) {
    const year = parseYearFromHeader(headerRow[i]);
    if (year) yearCols.push({ idx: i, year });
  }
  for (let r = headerIdx + 1; r < statsRecords.length; r++) {
    const row = statsRecords[r];
    const name = row[0]?.trim();
    if (!name || isStatsSkipRow(name)) continue;
    const bt = STATS_LIFT_MAP[name];
    if (!bt) continue;
    for (const { idx, year } of yearCols) {
      const weight = parseNum(row[idx]);
      if (weight == null || weight < 45 || weight > 700) continue;
      const date = `${year}-12-15`;
      oneRmHistory.push({ bt, weight, year, date });
      upsertStrength(bt, weight, date);
    }
  }
}

const maxByLift = {};
for (const h of oneRmHistory) {
  if (!maxByLift[h.bt] || h.weight > maxByLift[h.bt].weight) {
    maxByLift[h.bt] = h;
  }
}

// --- Build programming from 2026 SugarWod (group by date) ---
const byDate = new Map();
for (const w of workouts2026) {
  if (!byDate.has(w.date)) byDate.set(w.date, []);
  byDate.get(w.date).push(w);
}

const sql = [];
sql.push('-- Auto-generated: Paul Crossfit Tracker (CrossFit Stats) + SugarWod + Max Lifts');
sql.push('');
sql.push('-- Standalone PR / 1RM history only (preserve Triad class performances from 04)');
sql.push(`delete from public.athlete_performance where contact_id = '${PAUL}' and programming_id is null;`);
sql.push(`delete from public.athlete_benchmark_summary where contact_id = '${PAUL}';`);

for (const [bt, v] of Object.entries(strengthPrs)) {
  if (!v.weight) continue;
  sql.push(`insert into public.athlete_benchmark_summary (contact_id, benchmark_definition_id, current_pr_weight, date_pr_achieved)
select '${PAUL}', bd.id, ${v.weight}, ${sqlStr(v.date)}
from public.benchmark_definition bd
join public.benchmark_type t on t.id = bd.benchmark_type_id
where t.name = ${sqlStr(bt)} and bd.rep_count = 1
on conflict (contact_id, benchmark_definition_id) do update
set current_pr_weight = excluded.current_pr_weight, date_pr_achieved = excluded.date_pr_achieved;`);
}

// Yearly 1RM achievements (CrossFit Stats tab)
for (const h of oneRmHistory) {
  const isMax = maxByLift[h.bt]?.weight === h.weight && maxByLift[h.bt]?.date === h.date;
  sql.push(`insert into public.athlete_performance (contact_id, benchmark_type_id, benchmark_definition_id, performance_date, status, weight_lifted, score, is_pr)
select '${PAUL}', t.id, bd.id, ${sqlStr(h.date)}, 'completed', ${h.weight}, ${sqlStr(String(h.weight))}, ${isMax}
from public.benchmark_type t
join public.benchmark_definition bd on bd.benchmark_type_id = t.id and bd.rep_count = 1
where t.name = ${sqlStr(h.bt)}
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = '${PAUL}' and ap.benchmark_definition_id = bd.id and ap.performance_date = ${sqlStr(h.date)}
);`);
}

// Metcon PRs (standalone performances, no class programming)
for (const [bt, v] of Object.entries(metconPrs)) {
  sql.push(`insert into public.athlete_performance (contact_id, benchmark_type_id, performance_date, status, score, result_value, is_pr)
select '${PAUL}', t.id, ${sqlStr(v.date)}, 'completed', ${sqlStr(v.score)}, ${v.result_value}, true
from public.benchmark_type t where t.name = ${sqlStr(bt)}
and not exists (
  select 1 from public.athlete_performance ap
  where ap.contact_id = '${PAUL}' and ap.benchmark_type_id = t.id and ap.programming_id is null
    and ap.performance_date = ${sqlStr(v.date)}
);`);
}

const outPath = new URL('../supabase/remote/03_spreadsheet_import.sql', import.meta.url);
writeFileSync(outPath, sql.join('\n'));
console.log('Wrote', outPath.pathname || outPath);
console.log('Strength PRs:', Object.keys(strengthPrs).length);
console.log('CrossFit Stats 1RM history rows:', oneRmHistory.length);
console.log('Metcon PRs:', Object.keys(metconPrs).length);
console.log('2026 SugarWod rows:', workouts2026.length);
