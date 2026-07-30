import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { WorkoutScale } from "@/lib/format";
import { tryMarkGroupBlockComplete } from "@/lib/programming/segment-completion";

export type SaveGroupPerformanceInput = {
  contactId: string;
  segmentGroupId: string;
  wodDate: string;
  existingId?: string;
  score: string;
  resultValue: number | null;
  workoutScale: WorkoutScale | null;
};

/** Mutable fields only — ownership FKs are set on insert and must not change. */
function groupScoreMutablePayload(input: SaveGroupPerformanceInput) {
  return {
    score: input.score,
    result_value: input.resultValue,
    performance_date: input.wodDate,
    workout_scale: input.workoutScale,
    status: "completed" as const,
    is_pr: false,
    weight_lifted: null,
  };
}

export function useSaveGroupPerformance() {
  const [submitting, setSubmitting] = useState(false);

  async function save(
    input: SaveGroupPerformanceInput,
  ): Promise<{ error: string | null; id?: string }> {
    setSubmitting(true);
    const mutable = groupScoreMutablePayload(input);

    let id = input.existingId;
    let error: { message: string } | null = null;

    if (input.existingId) {
      const res = await supabase
        .from("athlete_performance")
        .update(mutable)
        .eq("id", input.existingId);
      error = res.error;
    } else {
      const res = await supabase
        .from("athlete_performance")
        .insert({
          ...mutable,
          contact_id: input.contactId,
          programming_id: null,
          programming_line_item_id: null,
          segment_group_id: input.segmentGroupId,
          benchmark_definition_id: null,
          benchmark_type_id: null,
        })
        .select("id")
        .single();
      error = res.error;
      id = res.data?.id ?? id;
    }

    if (!error) {
      await tryMarkGroupBlockComplete(input.contactId, input.segmentGroupId, input.wodDate);
    }

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null, id };
  }

  return { save, submitting };
}
