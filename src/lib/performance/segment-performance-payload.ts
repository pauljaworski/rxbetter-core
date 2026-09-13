import type { WorkoutScale } from "@/lib/format";
import type { Json } from "@/types/database";

export type SegmentPerformanceWriteInput = {
  score: string;
  resultValue: number | null;
  scoreMeta?: Json | null;
  wodDate: string;
  workoutScale: WorkoutScale | null;
};

export type SegmentPerformanceWritePayload = {
  score: string;
  result_value: number | null;
  performance_date: string;
  workout_scale: WorkoutScale | null;
  status: "completed";
  is_pr: false;
  programming_line_item_id: null;
  weight_lifted: null;
  score_meta?: Json;
};

/**
 * Build the athlete_performance write body.
 * On update, omit score_meta unless the caller passed it — a simple time field
 * must not wipe RFT/interval splits stored in score_meta.
 */
export function buildSegmentPerformanceWritePayload(
  input: SegmentPerformanceWriteInput,
  mode: "insert" | "update",
): SegmentPerformanceWritePayload {
  const payload: SegmentPerformanceWritePayload = {
    score: input.score,
    result_value: input.resultValue,
    performance_date: input.wodDate,
    workout_scale: input.workoutScale,
    status: "completed",
    is_pr: false,
    programming_line_item_id: null,
    weight_lifted: null,
  };

  if (input.scoreMeta !== undefined) {
    payload.score_meta = input.scoreMeta ?? {};
  } else if (mode === "insert") {
    payload.score_meta = {};
  }

  return payload;
}
