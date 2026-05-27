import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";

export type PerformanceWeightRow = {
  id: string;
  weight_lifted: number | null;
  performance_date: string | null;
  created_at: string | null;
  status?: string | null;
};

/** Pick heaviest lift; ties go to the latest performance_date. */
export function pickBestPerformanceRow(rows: PerformanceWeightRow[]): PerformanceWeightRow | null {
  let best: PerformanceWeightRow | null = null;
  for (const row of rows) {
    if (row.status && row.status !== "completed") continue;
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

export async function recomputeBenchmarkSummary(
  contactId: string,
  benchmarkDefinitionId: string,
): Promise<{ error: string | null }> {
  const { data: perfs, error: fetchErr } = await supabase
    .from("athlete_performance")
    .select("id, weight_lifted, performance_date, created_at, status")
    .eq("contact_id", contactId)
    .eq("benchmark_definition_id", benchmarkDefinitionId)
    .not("weight_lifted", "is", null);

  if (fetchErr) return { error: formatSupabaseError(fetchErr.message) };

  const best = pickBestPerformanceRow((perfs ?? []) as PerformanceWeightRow[]);
  if (!best) {
    const { error: flagErr } = await supabase
      .from("athlete_performance")
      .update({ is_pr: false })
      .eq("contact_id", contactId)
      .eq("benchmark_definition_id", benchmarkDefinitionId);
    if (flagErr) return { error: formatSupabaseError(flagErr.message) };

    const { error: delErr } = await supabase
      .from("athlete_benchmark_summary")
      .delete()
      .eq("contact_id", contactId)
      .eq("benchmark_definition_id", benchmarkDefinitionId);
    return { error: delErr ? formatSupabaseError(delErr.message) : null };
  }

  const bestWeight = Number(best.weight_lifted);
  const bestDate = best.performance_date ?? best.created_at?.slice(0, 10) ?? null;

  const { data: existing, error: sumFetchErr } = await supabase
    .from("athlete_benchmark_summary")
    .select("id")
    .eq("contact_id", contactId)
    .eq("benchmark_definition_id", benchmarkDefinitionId)
    .maybeSingle();

  if (sumFetchErr) return { error: formatSupabaseError(sumFetchErr.message) };

  const summaryPayload = {
    current_pr_weight: bestWeight,
    date_pr_achieved: bestDate,
  };

  const { error: sumWriteErr } = existing
    ? await supabase.from("athlete_benchmark_summary").update(summaryPayload).eq("id", existing.id)
    : await supabase.from("athlete_benchmark_summary").insert({
        contact_id: contactId,
        benchmark_definition_id: benchmarkDefinitionId,
        ...summaryPayload,
      });

  if (sumWriteErr) return { error: formatSupabaseError(sumWriteErr.message) };

  await supabase
    .from("athlete_performance")
    .update({ is_pr: false })
    .eq("contact_id", contactId)
    .eq("benchmark_definition_id", benchmarkDefinitionId);

  await supabase.from("athlete_performance").update({ is_pr: true }).eq("id", best.id);

  return { error: null };
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
