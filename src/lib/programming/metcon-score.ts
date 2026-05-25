import type { ScoreMetric } from "@/lib/programming/workout-scheme-schema";

/** Parse mm:ss or h:mm:ss to seconds for result_value storage. */
export function parseScoreToSeconds(score: string): number | null {
  const s = score.trim();
  const parts = s.split(":").map((x) => Number(x));
  if (parts.length >= 2 && parts.every((n) => Number.isFinite(n))) {
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

export function effectiveScoreMetric(
  metric: ScoreMetric | undefined,
  schemeKind?: string,
): ScoreMetric {
  if (metric) return metric;
  if (schemeKind === "amrap" || schemeKind === "amrap_repeat" || schemeKind === "tabata") {
    return "rounds_reps";
  }
  if (schemeKind === "emom_completion") return "completion";
  if (schemeKind === "interval_series") return "sum_interval_times";
  return "time";
}

export function scoreFieldLabel(metric: ScoreMetric): string {
  switch (metric) {
    case "rounds_reps":
      return "Rounds + reps";
    case "reps":
      return "Total reps";
    case "completion":
      return "Completion";
    case "sum_interval_times":
      return "Total time";
    default:
      return "Time";
  }
}

export function metconScorePlaceholder(
  metric: ScoreMetric | undefined,
  schemeKind?: string,
): string {
  const m = effectiveScoreMetric(metric, schemeKind);
  switch (m) {
    case "rounds_reps":
      return "e.g. 12 rounds + 5";
    case "reps":
      return "e.g. 287";
    case "completion":
      return "Mark when finished";
    case "sum_interval_times":
      return "e.g. 25:56 total";
    default:
      return "e.g. 16:48";
  }
}
