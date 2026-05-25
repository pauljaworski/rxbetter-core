import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { WorkoutScale } from "@/lib/format";
import { tryMarkProgrammingSegmentComplete } from "@/lib/programming/segment-completion";

export type SaveSegmentPerformanceInput = {
  contactId: string;
  programmingId: string;
  wodDate: string;
  existingId?: string;
  score: string;
  resultValue: number | null;
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
      performance_date: input.wodDate,
      workout_scale: input.workoutScale,
      status: "completed" as const,
      is_pr: false,
      programming_line_item_id: null,
      weight_lifted: null,
    };

    let id = input.existingId;
    let error: { message: string } | null = null;

    if (input.existingId) {
      const res = await supabase
        .from("athlete_performance")
        .update(payload)
        .eq("id", input.existingId);
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
