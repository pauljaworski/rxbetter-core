import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

export type PerformanceWeightRow = {
  id: string;
  weight_lifted: number | null;
  performance_date: string | null;
  created_at: string | null;
};

/** Pick heaviest lift; ties go to the latest performance_date. */
export function pickBestPerformanceRow(rows: PerformanceWeightRow[]): PerformanceWeightRow | null {
  let best: PerformanceWeightRow | null = null;
  for (const row of rows) {
    const w = Number(row.weight_lifted);
    if (!Number.isFinite(w) || w <= 0) continue;
    if (!best) {
      best = row;
      continue;
    }
    const bw = Number(best.weight_lifted);
    const date = row.performance_date ?? row.created_at?.slice(0, 10) ?? "";
    const bestDate = best.performance_date ?? best.created_at?.slice(0, 10) ?? "";
    if (w > bw || (w === bw && date > bestDate)) best = row;
  }
  return best;
}

/**
 * Refresh PR vault + is_pr flags for one athlete/definition.
 * Uses an atomic DB RPC so concurrent set logs cannot leave a stale lighter PR.
 */
export async function recomputeBenchmarkSummary(
  contactId: string,
  benchmarkDefinitionId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("recompute_athlete_benchmark_summary", {
    p_contact_id: contactId,
    p_benchmark_definition_id: benchmarkDefinitionId,
  });
  return { error: error ? formatSupabaseError(error.message) : null };
}

export type RecordAthletePrInput = {
  contactId: string;
  benchmarkDefinitionId: string;
  benchmarkTypeId: string | null;
  weightLb: number;
  performanceDate: string;
  repsPrescribed?: number | null;
};

/** Log a PR attempt on a chosen date, then refresh summary + is_pr flags from all attempts. */
export async function recordAthletePr(input: RecordAthletePrInput): Promise<{ error: string | null }> {
  const { error: insErr } = await supabase.from("athlete_performance").insert({
    contact_id: input.contactId,
    benchmark_definition_id: input.benchmarkDefinitionId,
    benchmark_type_id: input.benchmarkTypeId,
    programming_id: null,
    programming_line_item_id: null,
    performance_date: input.performanceDate,
    weight_lifted: input.weightLb,
    result_value: input.weightLb,
    reps_prescribed: input.repsPrescribed ?? null,
    status: "completed",
    is_pr: false,
  });

  if (insErr) return { error: formatSupabaseError(insErr.message) };
  return recomputeBenchmarkSummary(input.contactId, input.benchmarkDefinitionId);
}
