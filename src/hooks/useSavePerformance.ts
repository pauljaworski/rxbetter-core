import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import type { Database } from "@/types/database";

type PerformanceInsert = Database["public"]["Tables"]["athlete_performance"]["Insert"];
type PerformanceUpdate = Database["public"]["Tables"]["athlete_performance"]["Update"];
import type { WorkoutScale } from "@/lib/format";

export type SavePerformanceInput = {
  contactId: string;
  programmingId: string;
  lineItemId: string;
  wodDate: string;
  benchmarkDefinitionId: string | null;
  benchmarkTypeId: string | null;
  repsPrescribed: number | null;
  existingId?: string;
  score: string | null;
  weightLifted: number | null;
  rpe: number | null;
  isPr: boolean;
  status: "completed" | "failed";
  workoutScale: WorkoutScale | null;
  isMetcon: boolean;
};

export function useSavePerformance() {
  const [submitting, setSubmitting] = useState(false);

  async function save(
    input: SavePerformanceInput,
  ): Promise<{ error: string | null; id?: string }> {
    setSubmitting(true);
    const payload: PerformanceUpdate = {
      score: input.score,
      weight_lifted: input.weightLifted,
      result_value: input.weightLifted,
      rpe: input.rpe,
      reps_prescribed: input.repsPrescribed,
      performance_date: input.wodDate,
      is_pr: input.isPr,
      status: input.status,
      workout_scale: input.workoutScale,
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
          programming_line_item_id: input.lineItemId,
          benchmark_definition_id: input.benchmarkDefinitionId,
          benchmark_type_id: input.benchmarkTypeId,
        } satisfies PerformanceInsert)
        .select("id")
        .single();
      error = res.error;
      id = res.data?.id ?? id;
    }

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null, id };
  }

  async function removePerformance(performanceId: string): Promise<{ error: string | null }> {
    setSubmitting(true);
    // Prefer returning deleted rows so RLS no-ops (0 rows, no error) surface as failures.
    const { data, error } = await supabase
      .from("athlete_performance")
      .delete()
      .eq("id", performanceId)
      .select("id");
    setSubmitting(false);
    if (error) return { error: formatSupabaseError(error.message) };
    if (!data?.length) {
      return { error: "Could not clear this result. You may not have permission, or it was already removed." };
    }
    return { error: null };
  }

  return { save, removePerformance, submitting };
}
