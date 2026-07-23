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

    let id: string | undefined;
    let error: { message: string } | null = null;

    if (input.existingId) {
      const res = await supabase
        .from("athlete_performance")
        .update(payload)
        .eq("id", input.existingId)
        .eq("contact_id", input.contactId)
        .eq("segment_group_id", input.segmentGroupId)
        .eq("performance_date", input.wodDate)
        .is("programming_id", null)
        .is("programming_line_item_id", null)
        .select("id")
        .maybeSingle();
      error = res.error;
      id = res.data?.id;
    }

    if (!error && !id) {
      const existing = await supabase
        .from("athlete_performance")
        .select("id")
        .eq("contact_id", input.contactId)
        .eq("segment_group_id", input.segmentGroupId)
        .eq("performance_date", input.wodDate)
        .is("programming_id", null)
        .is("programming_line_item_id", null)
        .limit(1)
        .maybeSingle();
      error = existing.error;

      if (!error && existing.data?.id) {
        const res = await supabase
          .from("athlete_performance")
          .update(payload)
          .eq("id", existing.data.id)
          .eq("contact_id", input.contactId)
          .select("id")
          .single();
        error = res.error;
        id = res.data?.id;
      }
    }

    if (!error && !id) {
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
      id = res.data?.id;
    }

    if (!error) {
      await tryMarkGroupBlockComplete(input.contactId, input.segmentGroupId, input.wodDate);
    }

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null, id };
  }

  return { save, submitting };
}
