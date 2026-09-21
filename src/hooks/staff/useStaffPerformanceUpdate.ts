import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import { recomputeBenchmarkSummary } from "@/lib/pr/record-athlete-pr";

export type StaffPerformanceUpdateInput = {
  performanceId: string;
  score: string | null;
  weightLifted: number | null;
  rpe: number | null;
};

export function useStaffPerformanceUpdate() {
  const [submitting, setSubmitting] = useState(false);

  async function updatePerformance(
    input: StaffPerformanceUpdateInput,
  ): Promise<{ error: string | null }> {
    setSubmitting(true);

    const { data: existing, error: fetchErr } = await supabase
      .from("athlete_performance")
      .select("id, contact_id, benchmark_definition_id")
      .eq("id", input.performanceId)
      .maybeSingle();

    if (fetchErr) {
      setSubmitting(false);
      return { error: formatSupabaseError(fetchErr.message) };
    }
    if (!existing) {
      setSubmitting(false);
      return { error: "Score not found or you don't have access to update it." };
    }

    const { data: updatedRows, error } = await supabase
      .from("athlete_performance")
      .update({
        score: input.score,
        weight_lifted: input.weightLifted,
        result_value: input.weightLifted,
        rpe: input.rpe,
      })
      .eq("id", input.performanceId)
      .select("id");

    if (error) {
      setSubmitting(false);
      return { error: formatSupabaseError(error.message) };
    }
    if (!updatedRows?.length) {
      setSubmitting(false);
      return { error: "Score not found or you don't have access to update it." };
    }

    if (existing.benchmark_definition_id) {
      const { error: prErr } = await recomputeBenchmarkSummary(
        existing.contact_id,
        existing.benchmark_definition_id,
      );
      if (prErr) {
        setSubmitting(false);
        return { error: prErr };
      }
    }

    setSubmitting(false);
    return { error: null };
  }

  return { updatePerformance, submitting };
}
