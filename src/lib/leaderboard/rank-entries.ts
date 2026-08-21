import type { ScoreMetric } from "@/lib/programming/workout-scheme-schema";
import { effectiveScoreMetric } from "@/lib/programming/metcon-score";

export type LeaderboardPerfRow = {
  id: string;
  contact_id: string;
  programming_id: string | null;
  segment_group_id: string | null;
  score: string | null;
  result_value: number | null;
  workout_scale: string | null;
};

/**
 * Parse AMRAP-style scores to a sortable number (higher = better).
 * Encodes leftover reps in the last three digits so even rounds rank correctly:
 * "12" / "12 rounds" → 12000, "11+15" → 11015.
 */
export function parseRoundsRepsScore(score: string): number {
  const s = score.trim().toLowerCase();
  const plusMatch = s.match(/^(\d+)\s*(?:rounds?)?\s*\+\s*(\d+)/);
  if (plusMatch) return Number(plusMatch[1]) * 1000 + Number(plusMatch[2]);
  const wholeRounds = s.match(/^(\d+)\s*(?:rounds?)?$/);
  if (wholeRounds) return Number(wholeRounds[1]) * 1000;
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Total-rep scores (Cindy, chipper-for-reps) — raw count, not rounds+reps encoding. */
export function parseTotalRepsScore(score: string): number {
  const n = Number(score.trim().replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function sortKeyForScore(
  row: LeaderboardPerfRow,
  scoreMetric: ScoreMetric,
): number {
  if (row.result_value != null && Number.isFinite(row.result_value)) {
    if (scoreMetric === "time" || scoreMetric === "sum_interval_times") {
      return row.result_value;
    }
    return -row.result_value;
  }
  const score = row.score ?? "";
  if (scoreMetric === "rounds_reps") {
    return -parseRoundsRepsScore(score);
  }
  if (scoreMetric === "reps") {
    return -parseTotalRepsScore(score);
  }
  if (scoreMetric === "time" || scoreMetric === "sum_interval_times") {
    const parsed = score.match(/(\d+):(\d{2})(?::(\d{2}))?/);
    if (parsed) {
      const h = parsed[3] != null ? Number(parsed[1]) : 0;
      const m = parsed[3] != null ? Number(parsed[2]) : Number(parsed[1]);
      const sec = parsed[3] != null ? Number(parsed[3]) : Number(parsed[2]);
      return h * 3600 + m * 60 + sec;
    }
  }
  return 0;
}

export function rankLeaderboardEntries<T extends LeaderboardPerfRow>(
  entries: T[],
  scoreMetric: ScoreMetric | undefined,
  schemeKind?: string,
): T[] {
  const metric = effectiveScoreMetric(scoreMetric, schemeKind);
  return [...entries].sort((a, b) => sortKeyForScore(a, metric) - sortKeyForScore(b, metric));
}
