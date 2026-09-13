import { isIntervalSeriesScheme } from "@/lib/programming/interval-score";
import { rftUsesRoundSplits } from "@/lib/programming/rft-score";
import { parseWorkoutScheme, type WorkoutScheme } from "@/lib/programming/workout-scheme-schema";

export type SegmentScoreFormKind = "rft_splits" | "interval" | "simple";

/** Which athlete score UI a metcon scheme should use (collapsed and expanded). */
export function resolveSegmentScoreFormKind(
  scheme: WorkoutScheme | null,
): SegmentScoreFormKind {
  if (rftUsesRoundSplits(scheme)) return "rft_splits";
  if (isIntervalSeriesScheme(scheme)) return "interval";
  return "simple";
}

export function resolveSegmentScoreFormKindFromRaw(
  workoutScheme: unknown,
): SegmentScoreFormKind {
  return resolveSegmentScoreFormKind(parseWorkoutScheme(workoutScheme));
}
