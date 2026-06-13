import type { SpreadsheetTable } from "./parse-spreadsheet";

export type ImportField =
  | "date"
  | "movement"
  | "weight"
  | "reps"
  | "score"
  | "scale"
  | "workout_name"
  | "skip";

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  date: "Date",
  movement: "Movement / lift",
  weight: "Weight (lb)",
  reps: "Reps / RM",
  score: "Score / time",
  scale: "Scale (Rx, Scaled…)",
  workout_name: "Workout name",
  skip: "— Skip —",
};

const FIELD_ALIASES: Record<Exclude<ImportField, "skip">, string[]> = {
  date: ["date", "performed", "day", "workout date", "performed_at", "workout_date"],
  movement: ["movement", "exercise", "lift", "benchmark", "benchmark name", "benchmark_name"],
  weight: ["weight", "load", "lb", "lbs", "max", "max weight", "weight_lb"],
  reps: ["reps", "rm", "rep", "rep max", "rep_count", "reps_prescribed"],
  score: ["score", "time", "result", "finish", "wod score"],
  scale: ["scale", "level", "rx", "workout scale", "workout_scale"],
  workout_name: ["workout", "wod", "workout name", "wod name", "name", "title"],
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function scoreForHeader(header: string, aliases: string[]): number {
  const n = normalizeHeader(header);
  let best = 0;
  for (const a of aliases) {
    if (n === a) return 100;
    if (n.includes(a) || a.includes(n)) best = Math.max(best, 60);
    const words = a.split(" ");
    const hits = words.filter((w) => n.includes(w)).length;
    if (hits > 0) best = Math.max(best, 30 + hits * 10);
  }
  return best;
}

/** Auto-map spreadsheet headers to import fields. */
export function detectColumnMapping(headers: string[]): ImportField[] {
  const used = new Set<ImportField>();
  return headers.map((header) => {
    let bestField: ImportField = "skip";
    let bestScore = 0;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [
      Exclude<ImportField, "skip">,
      string[],
    ][]) {
      const score = scoreForHeader(header, aliases);
      if (score > bestScore && !used.has(field)) {
        bestScore = score;
        bestField = field;
      }
    }
    if (bestScore >= 30 && bestField !== "skip") {
      used.add(bestField);
      return bestField;
    }
    return "skip";
  });
}

export function applyColumnMapping(
  table: SpreadsheetTable,
  mapping: ImportField[],
): Record<ImportField, string | null>[] {
  return table.rows.map((row) => {
    const out = {} as Record<ImportField, string | null>;
    for (const field of Object.keys(IMPORT_FIELD_LABELS) as ImportField[]) {
      out[field] = null;
    }
    mapping.forEach((field, colIdx) => {
      if (field === "skip") return;
      const val = row[colIdx]?.trim();
      if (val) out[field] = val;
    });
    return out;
  });
}
