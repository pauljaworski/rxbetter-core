import type { WorkoutScale } from "@/lib/format";
import type { Database, Json } from "@/types/database";

type PerformanceUpdate = Database["public"]["Tables"]["athlete_performance"]["Update"];

/** Mutable score fields for segment-level athlete_performance rows. */
export type SegmentPerformanceWriteFields = {
  score: string;
  resultValue: number | null;
  wodDate: string;
  workoutScale: WorkoutScale | null;
  /**
   * When omitted, update payloads leave score_meta untouched so MetconScoreRow
   * (and similar callers) cannot wipe RFT round splits or import labels.
   * Pass null/{} explicitly to clear.
   */
  scoreMeta?: Json | null;
};

/**
 * Build an UPDATE payload that never re-sends ownership FKs
 * (contact_id, programming_id, programming_line_item_id, segment_group_id).
 * Those columns are immutable via DB trigger.
 */
export function buildSegmentPerformanceUpdate(
  fields: SegmentPerformanceWriteFields,
): PerformanceUpdate {
  const payload: PerformanceUpdate = {
    score: fields.score,
    result_value: fields.resultValue,
    performance_date: fields.wodDate,
    workout_scale: fields.workoutScale,
    status: "completed",
    is_pr: false,
    weight_lifted: null,
  };
  if ("scoreMeta" in fields) {
    payload.score_meta = fields.scoreMeta ?? {};
  }
  return payload;
}
