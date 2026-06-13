import { prescribedLevelLabel, type WorkoutScale } from "@/lib/format";
import type { Json } from "@/types/database";

export type ImportScoreMeta = {
  source?: "import";
  label?: string;
  kind?: "lift" | "workout";
};

export type PerformanceHistoryLabelInput = {
  programming_id: string | null;
  bench_name?: string | null;
  wod_name?: string | null;
  weight_lifted: number | null;
  score: string | null;
  rep_count?: number | null;
  reps_prescribed?: number | null;
  workout_scale?: WorkoutScale | null;
  stimulus?: string | null;
  sub_stimulus?: string | null;
  purpose_variation?: string | null;
  score_meta?: Json | null;
};

function parseImportMeta(scoreMeta: Json | null | undefined): ImportScoreMeta | null {
  if (!scoreMeta || typeof scoreMeta !== "object" || Array.isArray(scoreMeta)) return null;
  const m = scoreMeta as Record<string, unknown>;
  if (m.source !== "import") return null;
  return {
    source: "import",
    label: typeof m.label === "string" ? m.label : undefined,
    kind: m.kind === "lift" || m.kind === "workout" ? m.kind : undefined,
  };
}

function repMaxLabel(row: PerformanceHistoryLabelInput): string | null {
  const reps = row.rep_count ?? row.reps_prescribed;
  if (reps == null || reps <= 0) return null;
  return `${reps} RM`;
}

function movementContext(row: PerformanceHistoryLabelInput): string[] {
  const parts: string[] = [];
  const rm = repMaxLabel(row);
  if (rm) parts.push(rm);
  if (row.purpose_variation) parts.push(row.purpose_variation);
  else if (row.sub_stimulus) parts.push(row.sub_stimulus);
  else if (row.stimulus) parts.push(row.stimulus);
  return parts;
}

function scalePart(scale: WorkoutScale | null | undefined): string | null {
  if (!scale) return null;
  return prescribedLevelLabel(scale) ?? scale;
}

/** Human-readable title + subtitle for a history ledger row. */
export function performanceHistoryLabels(row: PerformanceHistoryLabelInput): {
  title: string;
  subtitle: string;
} {
  const importMeta = parseImportMeta(row.score_meta);
  const importLabel = importMeta?.label?.trim() || null;
  const scale = scalePart(row.workout_scale);
  const isClassWod = Boolean(row.programming_id);
  const isStandalone = !isClassWod;
  const isImport = importMeta?.source === "import";

  const hasWeight = row.weight_lifted != null && Number(row.weight_lifted) > 0;

  if (hasWeight) {
    const title = row.bench_name ?? importLabel ?? "Strength lift";
    const parts = movementContext(row);
    if (scale) parts.push(scale);
    if (isImport) parts.push("Imported");
    else if (isStandalone) parts.push("Personal log");
    return {
      title,
      subtitle: parts.join(" · ") || (isImport ? "Imported lift" : "Strength"),
    };
  }

  if (row.score) {
    const title = row.wod_name ?? row.bench_name ?? importLabel ?? "Workout";
    const parts: string[] = [];
    if (isClassWod) {
      if (scale) parts.push(scale);
      if (row.stimulus) parts.push(row.stimulus);
    } else {
      if (isImport) parts.push("Imported workout");
      else if (isStandalone) parts.push("Personal workout");
      if (scale) parts.push(scale);
      if (row.bench_name && row.bench_name !== title) parts.push(row.bench_name);
      else if (row.stimulus) parts.push(row.stimulus);
    }
    return { title, subtitle: parts.filter(Boolean).join(" · ") };
  }

  const title = row.bench_name ?? row.wod_name ?? importLabel ?? "Training log";
  const parts = movementContext(row);
  if (scale) parts.push(scale);
  if (isImport) parts.push("Imported");
  return { title, subtitle: parts.join(" · ") };
}
