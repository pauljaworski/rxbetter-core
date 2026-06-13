import type { WorkoutScale } from "@/lib/format";
import type { ImportField } from "./map-import-columns";
import {
  matchBenchmarkType,
  resolveDefinitionId,
  type BenchmarkCatalogEntry,
  type BenchmarkDefinitionEntry,
} from "./match-benchmark";

export type ImportRowKind = "lift" | "workout" | "skip";

export type PreparedImportRow = {
  rowIndex: number;
  kind: ImportRowKind;
  date: string | null;
  movementLabel: string | null;
  weightLb: number | null;
  repCount: number | null;
  score: string | null;
  workoutName: string | null;
  workoutScale: WorkoutScale | null;
  benchmarkTypeId: string | null;
  benchmarkDefinitionId: string | null;
  skipReason: string | null;
};

function parseNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseRepCount(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse common date formats to yyyy-MM-dd. */
export function parseImportDate(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const mdy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (mdy) {
    const yr = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${yr}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  return null;
}

function parseWorkoutScale(raw: string | null): WorkoutScale | null {
  if (!raw) return null;
  const n = raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/\+/g, "_plus");
  if (n === "rx+" || n === "rx_plus") return "rx_plus";
  if (n === "rx") return "rx";
  if (n === "fx" || n === "fitness") return "fx";
  if (n === "scaled" || n === "scale") return "scaled";
  return null;
}

export function prepareImportRows(
  mapped: Record<ImportField, string | null>[],
  catalog: BenchmarkCatalogEntry[],
  definitions: BenchmarkDefinitionEntry[],
): PreparedImportRow[] {
  return mapped.map((row, rowIndex) => {
    const date = parseImportDate(row.date);
    const weightLb = parseNumber(row.weight);
    const repCount = parseRepCount(row.reps) ?? (weightLb != null ? 1 : null);
    const movementLabel = row.movement?.trim() || row.workout_name?.trim() || null;
    const score = row.score?.trim() || null;
    const workoutName = row.workout_name?.trim() || movementLabel;
    const workoutScale = parseWorkoutScale(row.scale);

    if (!date) {
      return emptyRow(rowIndex, "Missing or invalid date");
    }

    if (weightLb != null && movementLabel) {
      const bench = matchBenchmarkType(movementLabel, catalog);
      const defId = bench
        ? resolveDefinitionId(bench.id, repCount ?? 1, definitions)
        : null;
      return {
        rowIndex,
        kind: "lift",
        date,
        movementLabel,
        weightLb,
        repCount: repCount ?? 1,
        score: null,
        workoutName: null,
        workoutScale,
        benchmarkTypeId: bench?.id ?? null,
        benchmarkDefinitionId: defId,
        skipReason: bench ? (defId ? null : `No ${repCount ?? 1}RM definition for ${bench.name}`) : "Movement not matched",
      };
    }

    if (score && workoutName) {
      return {
        rowIndex,
        kind: "workout",
        date,
        movementLabel: workoutName,
        weightLb: null,
        repCount: null,
        score,
        workoutName,
        workoutScale,
        benchmarkTypeId: matchBenchmarkType(workoutName, catalog)?.id ?? null,
        benchmarkDefinitionId: null,
        skipReason: null,
      };
    }

    return emptyRow(rowIndex, "Need weight + movement, or score + workout name");
  });
}

function emptyRow(rowIndex: number, reason: string): PreparedImportRow {
  return {
    rowIndex,
    kind: "skip",
    date: null,
    movementLabel: null,
    weightLb: null,
    repCount: null,
    score: null,
    workoutName: null,
    workoutScale: null,
    benchmarkTypeId: null,
    benchmarkDefinitionId: null,
    skipReason: reason,
  };
}

export function countImportableRows(rows: PreparedImportRow[]): {
  lifts: number;
  workouts: number;
  skipped: number;
  needsMatch: number;
} {
  let lifts = 0;
  let workouts = 0;
  let skipped = 0;
  let needsMatch = 0;
  for (const r of rows) {
    if (r.kind === "skip") {
      skipped++;
      continue;
    }
    if (r.kind === "lift") {
      if (!r.benchmarkTypeId || !r.benchmarkDefinitionId) needsMatch++;
      else lifts++;
    }
    if (r.kind === "workout") workouts++;
  }
  return { lifts, workouts, skipped, needsMatch };
}
