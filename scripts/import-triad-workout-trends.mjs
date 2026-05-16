/**
 * Import Triad Workout Trends → programming + Paul's logged results
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

function sqlStr(s) {
  if (s == null || s === '') return 'null';
  return `'${String(s).replace(/'/g, "''").replace(/"/g, '')}'`;
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
  rows.push({
    iso,
    day: cols[1],
    strength,
    strengthWeight,
    metcon,
    metconScore,
    rxScaled,
  });
}

const sql = [];
sql.push('-- Triad Workout Trends: 3-16--tbd Cycle (Triad Workout Trends (1).xlsx)');
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

for (const r of rows) {
  const dateKey = r.iso.replace(/-/g, '');
  let order = 1;
  const makeId = (ord) =>
    `e3000000-0000-4000-8000-${dateKey}${String(ord).padStart(4, '0')}`;
  const scale = parseWorkoutScale(r.rxScaled);

  if (!isNA(r.strength)) {
    const id = makeId(order);
    const name = strengthTitle(r.strength);
    sql.push(`insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, prescribed_scale, display_order, description, source)
values ('${id}', '${GYM}', '${LIB}', ${sqlStr(name)}, ${sqlStr(r.iso)}, 'weightlifting', 'rx', ${order}, ${sqlStr(r.strength)}, 'gym');`);

    const outcome = parseStrengthOutcome(r.strengthWeight);
    if (outcome) {
      const wl = outcome.weight != null ? outcome.weight : 'null';
      sql.push(`insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, weight_lifted, is_pr)
values ('${PAUL}', '${id}', ${sqlStr(r.iso)}, '${outcome.status}', ${sqlStr(outcome.score)}, ${wl}, false);`);
    }
    order++;
  }

  if (!isNA(r.metcon)) {
    const id = makeId(order);
    const name = metconTitle(r.metcon);
    const fmt = inferMetconFormat(r.metcon);
    sql.push(`insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source)
values ('${id}', '${GYM}', '${LIB}', ${sqlStr(name)}, ${sqlStr(r.iso)}, 'metcon', ${sqlStr(fmt)}, 'rx', ${order}, ${sqlStr(r.metcon)}, 'gym');`);

    if (!isNA(r.metconScore)) {
      const score = String(r.metconScore).trim();
      const rv = parseScoreToSeconds(score);
      const scaleSql = scale ? `'${scale}'` : 'null';
      sql.push(`insert into public.athlete_performance (contact_id, programming_id, performance_date, status, score, result_value, workout_scale, is_pr)
values ('${PAUL}', '${id}', ${sqlStr(r.iso)}, 'completed', ${sqlStr(score)}, ${rv ?? 'null'}, ${scaleSql}, false);`);
    }
    order++;
  }
}

sql.push('');
sql.push('alter table public.programming enable trigger programming_update_guard;');
sql.push('alter table public.programming_line_item enable trigger pli_update_guard;');

const outPath = join(dirname(fileURLToPath(import.meta.url)), '../supabase/remote/04_triad_workout_trends.sql');
writeFileSync(outPath, sql.join('\n'));

let perfCount = (sql.join('\n').match(/insert into public.athlete_performance/g) || []).length;
console.log('Wrote', outPath);
console.log('Days:', rows.length);
console.log('Performances:', perfCount);
console.log('From', rows[0]?.iso, 'to', rows[rows.length - 1]?.iso);
