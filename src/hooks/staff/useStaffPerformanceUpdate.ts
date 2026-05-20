import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

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
    const { error } = await supabase
      .from("athlete_performance")
      .update({
        score: input.score,
        weight_lifted: input.weightLifted,
        result_value: input.weightLifted,
        rpe: input.rpe,
      })
      .eq("id", input.performanceId);

    setSubmitting(false);
    return { error: error ? formatSupabaseError(error.message) : null };
  }

  return { updatePerformance, submitting };
}
