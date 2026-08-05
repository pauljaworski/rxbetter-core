import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { WorkoutScale } from "@/lib/format";
import { tryMarkProgrammingSegmentComplete } from "@/lib/programming/segment-completion";
import type { Json } from "@/types/database";
import {
  findExistingPerformanceId,
  isUniqueViolation,
  resolvePerformanceIdForSave,
} from "@/lib/performance/performance-ledger";

export type SaveSegmentPerformanceInput = {
  contactId: string;
  programmingId: string;
  wodDate: string;
  existingId?: string;
  score: string;
  resultValue: number | null;
  scoreMeta?: Json | null;
  workoutScale: WorkoutScale | null;
  programmingSegment: string | null;
};

export function useSaveSegmentPerformance() {
  const [submitting, setSubmitting] = useState(false);

  async function save(
    input: SaveSegmentPerformanceInput,
  ): Promise<{ error: string | null; id?: string }> {
    setSubmitting(true);
    const payload = {
      score: input.score,
      result_value: input.resultValue,
      score_meta: input.scoreMeta ?? {},
      performance_date: input.wodDate,
      workout_scale: input.workoutScale,
      status: "completed" as const,
      is_pr: false,
      programming_line_item_id: null,
      weight_lifted: null,
    };

    const ledgerKey = {
      kind: "segment" as const,
      contactId: input.contactId,
      programmingId: input.programmingId,
    };

    let id = await resolvePerformanceIdForSave(input.existingId, ledgerKey);
    let error: { message: string; code?: string } | null = null;

    if (id) {
      const res = await supabase.from("athlete_performance").update(payload).eq("id", id);
      error = res.error;
    } else {
      const res = await supabase
        .from("athlete_performance")
        .insert({
          ...payload,
          contact_id: input.contactId,
          programming_id: input.programmingId,
          benchmark_definition_id: null,
          benchmark_type_id: null,
        })
        .select("id")
        .single();
      error = res.error;
      id = res.data?.id ?? id;

      if (error && isUniqueViolation(error)) {
        const existingId = await findExistingPerformanceId(ledgerKey);
        if (existingId) {
          const retry = await supabase
            .from("athlete_performance")
            .update(payload)
            .eq("id", existingId);
          error = retry.error;
          id = existingId;
        }
      }
    }

    if (!error) {
      await tryMarkProgrammingSegmentComplete(
        input.contactId,
        input.programmingId,
        input.wodDate,
        input.programmingSegment,
      );
    }

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null, id };
  }

  return { save, submitting };
}
