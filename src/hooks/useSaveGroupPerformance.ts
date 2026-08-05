import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { WorkoutScale } from "@/lib/format";
import { tryMarkGroupBlockComplete } from "@/lib/programming/segment-completion";
import {
  findExistingPerformanceId,
  isUniqueViolation,
  resolvePerformanceIdForSave,
} from "@/lib/performance/performance-ledger";

export type SaveGroupPerformanceInput = {
  contactId: string;
  segmentGroupId: string;
  wodDate: string;
  existingId?: string;
  score: string;
  resultValue: number | null;
  workoutScale: WorkoutScale | null;
};

export function useSaveGroupPerformance() {
  const [submitting, setSubmitting] = useState(false);

  async function save(
    input: SaveGroupPerformanceInput,
  ): Promise<{ error: string | null; id?: string }> {
    setSubmitting(true);
    const payload = {
      score: input.score,
      result_value: input.resultValue,
      performance_date: input.wodDate,
      workout_scale: input.workoutScale,
      status: "completed" as const,
      is_pr: false,
      programming_id: null,
      programming_line_item_id: null,
      segment_group_id: input.segmentGroupId,
      weight_lifted: null,
    };

    const ledgerKey = {
      kind: "group" as const,
      contactId: input.contactId,
      segmentGroupId: input.segmentGroupId,
      performanceDate: input.wodDate,
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
      await tryMarkGroupBlockComplete(input.contactId, input.segmentGroupId, input.wodDate);
    }

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null, id };
  }

  return { save, submitting };
}
