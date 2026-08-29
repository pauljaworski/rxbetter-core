import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

export type StaffPerformanceUpdateInput = {
  performanceId: string;
  score: string | null;
  weightLifted: number | null;
  rpe: number | null;
};

export const STAFF_SCORE_UPDATE_DENIED =
  "Score wasn't saved. Confirm you have coach or admin access at this gym, then try again.";

/** PostgREST returns no error when RLS filters every UPDATE row. */
export function staffPerformanceUpdateApplied(
  updatedRows: { id: string }[] | null | undefined,
): boolean {
  return (updatedRows?.length ?? 0) > 0;
}

export function useStaffPerformanceUpdate() {
  const [submitting, setSubmitting] = useState(false);

  async function updatePerformance(
    input: StaffPerformanceUpdateInput,
  ): Promise<{ error: string | null }> {
    setSubmitting(true);
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

    setSubmitting(false);
    if (error) return { error: formatSupabaseError(error.message) };
    if (!staffPerformanceUpdateApplied(updatedRows)) {
      return { error: STAFF_SCORE_UPDATE_DENIED };
    }
    return { error: null };
  }

  return { updatePerformance, submitting };
}
