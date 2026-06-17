/**
 * Import Triad SugarWOD export xlsx → programming + line items (draft, unpublished).
 * Source: Google Drive Crossfit folder exports.
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import XLSX from 'xlsx';

const FILES = [
  'G:/.shortcut-targets-by-id/11Xq6cUUOFH_u3AJCtHkZPyMoSf1HgdCS/The Jaworskis/Fitness & Health/Crossfit/Triad Workouts 6_1_26-6_27_26.xlsx',
  'G:/.shortcut-targets-by-id/11Xq6cUUOFH_u3AJCtHkZPyMoSf1HgdCS/The Jaworskis/Fitness & Health/Crossfit/Triad Workouts 7_4_26-7_25_26.xlsx',
];

const GYM_SQL = `(select id from public.gym where name ilike 'Triad Training' limit 1)`;
const LIB_SQL = `(select pl.id from public.program_library pl join public.gym g on g.id = pl.gym_id where g.name ilike 'Triad Training' and pl.name ilike 'CrossFit' limit 1)`;

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
  'Shoulder Press',
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
  'Shoulder Press': 'Strict Press',
};

let pliCounter = 1;

function sqlStr(s) {
  if (s == null || s === '') return 'null';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function excelToIso(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n)) return null;
  const d = new Date(Math.round((n - 25569) * 86400 * 1000));
  return d.toISOString().slice(0, 10);
}

function btSubquery(liftName) {
  if (!liftName) return 'null';
  return `(select id from public.benchmark_type where name = ${sqlStr(liftName)})`;
}

function bdSubquery(liftName, repCount) {
  if (!liftName || !repCount) return 'null';
  return `(select bd.id from public.benchmark_definition bd join public.benchmark_type bt on bt.id = bd.benchmark_type_id where bt.name = ${sqlStr(liftName)} and bd.rep_count = ${repCount})`;
}

function detectLift(name) {
  const raw = String(name).trim();
  for (const lift of LIFT_NAMES) {
    if (raw.toLowerCase() === lift.toLowerCase() || raw.toLowerCase().startsWith(lift.toLowerCase())) {
      return LIFT_TO_BENCHMARK[lift] || lift;
    }
  }
  return null;
}

function inferMetconFormat(text) {
  const t = String(text).toUpperCase();
  if (/\bAMRAP\b/.test(t)) return 'amrap';
  if (/\bEMOM\b/.test(t)) return 'emom';
  if (/\bCHIPPER\b/.test(t)) return 'chipper';
  return 'for_time';
}

function extractMetconName(body, header, scale) {
  const quoted = String(body).match(/"([^"]+)"/);
  if (quoted) return quoted[1].slice(0, 80);
  return scale === 'scaled' ? 'Metcon (Scaled)' : 'Metcon';
}

function parseSections(detail) {
  const segments = [];
  const blocks = String(detail)
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.replace(/^\t+/, '').trim());
    const header = lines[0] || '';
    const body = lines.slice(1).filter((l) => l).join('\n').trim();
    const fullText = body ? `${header}\n${body}` : header;

    const strengthMatch = header.match(/^(.+?)\s*\((\d+)\s*[xX×]\s*(\d+)\)\s*$/i);
    if (strengthMatch) {
      const liftLabel = strengthMatch[1].trim();
      const sets = parseInt(strengthMatch[2], 10);
      const reps = parseInt(strengthMatch[3], 10);
      segments.push({
        kind: 'strength',
        name: liftLabel,
        lift: detectLift(liftLabel),
        sets,
        reps,
        description: fullText,
      });
      continue;
    }

    if (/^cross\s*fit/i.test(header)) {
      const scale = /\brx\s*\+|\brx\+/i.test(fullText) ? 'rx_plus' : 'rx';
      segments.push({
        kind: 'metcon',
        name: extractMetconName(body, header, scale === 'scaled' ? 'scaled' : 'rx'),
        prescribed_scale: scale,
        format: inferMetconFormat(fullText),
        description: fullText,
      });
      continue;
    }

    if (/^performance/i.test(header)) {
      segments.push({
        kind: 'metcon',
        name: extractMetconName(body, header, 'scaled'),
        prescribed_scale: 'scaled',
        format: inferMetconFormat(fullText),
        description: fullText,
      });
    }
  }

  return segments;
}

function makePliId() {
  return `f5000000-0000-4000-8000-${String(pliCounter++).padStart(12, '0')}`;
}

function loadRows() {
  const rows = [];
  for (const path of FILES) {
    const wb = XLSX.readFile(path);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    for (const cols of aoa.slice(1)) {
      const iso = excelToIso(cols[0]);
      const detail = cols[3];
      if (!iso || !detail || !String(detail).trim()) continue;
      rows.push({ iso, workoutName: cols[1], detail: String(detail) });
    }
  }
  rows.sort((a, b) => a.iso.localeCompare(b.iso));
  return rows;
}

const rows = loadRows();
if (!rows.length) {
  console.error('No rows parsed from input files.');
  process.exit(1);
}

const minDate = rows[0].iso;
const maxDate = rows[rows.length - 1].iso;

const sql = [];
sql.push('-- Triad SugarWOD programming import (draft — published_at left null)');
sql.push('alter table public.programming disable trigger programming_update_guard;');
sql.push('alter table public.programming_line_item disable trigger pli_update_guard;');
sql.push('');
sql.push(`delete from public.athlete_performance where programming_id in (
  select id from public.programming where gym_id = ${GYM_SQL}
    and wod_date >= ${sqlStr(minDate)} and wod_date <= ${sqlStr(maxDate)} and source = 'gym'
);`);
sql.push(`delete from public.programming_library_assignment where programming_id in (
  select id from public.programming where gym_id = ${GYM_SQL}
    and wod_date >= ${sqlStr(minDate)} and wod_date <= ${sqlStr(maxDate)} and source = 'gym'
);`);
sql.push(`delete from public.programming_line_item where programming_id in (
  select id from public.programming where gym_id = ${GYM_SQL}
    and wod_date >= ${sqlStr(minDate)} and wod_date <= ${sqlStr(maxDate)} and source = 'gym'
);`);
sql.push(`delete from public.programming where gym_id = ${GYM_SQL}
  and wod_date >= ${sqlStr(minDate)} and wod_date <= ${sqlStr(maxDate)} and source = 'gym';`);
sql.push('');

let progCount = 0;
let pliCount = 0;

for (const row of rows) {
  const segments = parseSections(row.detail);
  if (!segments.length) continue;

  const dateKey = row.iso.replace(/-/g, '');
  let order = 1;

  for (const seg of segments) {
    const progId = `e5000000-0000-4000-8000-${dateKey}${String(order).padStart(4, '0')}`;

    if (seg.kind === 'strength') {
      sql.push(`insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, programming_subtype, prescribed_scale, display_order, description, source, published_at)
values ('${progId}', ${GYM_SQL}, ${LIB_SQL}, ${sqlStr(seg.name)}, ${sqlStr(row.iso)}, 'weightlifting', 'strength', 'rx', ${order}, ${sqlStr(seg.description)}, 'gym', null);`);
      sql.push(`insert into public.programming_library_assignment (programming_id, program_library_id)
values ('${progId}', ${LIB_SQL}) on conflict do nothing;`);

      const lift = seg.lift;
      const setCount = Math.max(1, seg.sets || 1);
      const reps = seg.reps || 1;
      for (let s = 1; s <= setCount; s++) {
        const pliId = makePliId();
        sql.push(`insert into public.programming_line_item (id, programming_id, benchmark_type_id, benchmark_definition_id, sequence_number, reps_prescribed, status)
values ('${pliId}', '${progId}', ${btSubquery(lift)}, ${bdSubquery(lift, reps)}, ${s}, ${reps}, 'pending');`);
        pliCount++;
      }
      progCount++;
      order++;
      continue;
    }

    if (seg.kind === 'metcon') {
      sql.push(`insert into public.programming (id, gym_id, program_library_id, name, wod_date, programming_segment, metcon_format, prescribed_scale, display_order, description, source, published_at)
values ('${progId}', ${GYM_SQL}, ${LIB_SQL}, ${sqlStr(seg.name)}, ${sqlStr(row.iso)}, 'metcon', ${sqlStr(seg.format)}, ${sqlStr(seg.prescribed_scale)}, ${order}, ${sqlStr(seg.description)}, 'gym', null);`);
      sql.push(`insert into public.programming_library_assignment (programming_id, program_library_id)
values ('${progId}', ${LIB_SQL}) on conflict do nothing;`);

      const pliId = makePliId();
      const preview = seg.description.split('\n').find((l) => l.trim().length > 10) ?? seg.description;
      sql.push(`insert into public.programming_line_item (id, programming_id, sequence_number, prescribed_score, status)
values ('${pliId}', '${progId}', 1, ${sqlStr(preview.slice(0, 500))}, 'pending');`);
      pliCount++;
      progCount++;
      order++;
    }
  }
}

sql.push('');
sql.push('alter table public.programming enable trigger programming_update_guard;');
sql.push('alter table public.programming_line_item enable trigger pli_update_guard;');

const outPath = join(dirname(fileURLToPath(import.meta.url)), '../supabase/remote/05_triad_sugarwod_programming.sql');
writeFileSync(outPath, sql.join('\n'));

console.log('Wrote', outPath);
console.log('Days:', rows.length);
console.log('Programming segments:', progCount);
console.log('Line items:', pliCount);
console.log('Date range:', minDate, '→', maxDate);
