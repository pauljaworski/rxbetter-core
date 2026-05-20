import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "./useAsyncState";

export type PrRow = {
  id: string;
  current_pr_weight: number | null;
  date_pr_achieved: string | null;
  bench_name: string;
  rep_count: number;
  stimulus: string | null;
  sub_stimulus: string | null;
  purpose_variation: string | null;
  benchmark_type_id: string | null;
};

export function useBenchmarkSummaries(contactId: string | null) {
  const loader = useCallback(async (): Promise<PrRow[]> => {
    if (!contactId) return [];

    const { data: summary, error } = await supabase
      .from("athlete_benchmark_summary")
      .select("id, current_pr_weight, date_pr_achieved, benchmark_definition_id")
      .eq("contact_id", contactId);

    if (error) throw new Error(error.message);

    const defIds = (summary ?? []).map((s) => s.benchmark_definition_id);
    const { data: defs } = defIds.length
      ? await supabase.from("benchmark_definition").select("id, rep_count, benchmark_type_id").in("id", defIds)
      : { data: [] as { id: string; rep_count: number; benchmark_type_id: string }[] };

    const typeIds = Array.from(new Set((defs ?? []).map((d) => d.benchmark_type_id)));
    const { data: types } = typeIds.length
      ? await supabase
          .from("benchmark_type")
          .select("id, name, stimulus, sub_stimulus, purpose_variation")
          .in("id", typeIds)
      : { data: [] as { id: string; name: string; stimulus: string | null; sub_stimulus: string | null; purpose_variation: string | null }[] };

    const typeMap = new Map((types ?? []).map((t) => [t.id, t]));
    const defMap = new Map((defs ?? []).map((d) => [d.id, d]));

    return (summary ?? []).map((s) => {
      const d = defMap.get(s.benchmark_definition_id);
      const t = d ? typeMap.get(d.benchmark_type_id) : undefined;
      return {
        id: s.id,
        current_pr_weight: s.current_pr_weight,
        date_pr_achieved: s.date_pr_achieved,
        bench_name: t?.name ?? "Lift",
        rep_count: d?.rep_count ?? 1,
        stimulus: t?.stimulus ?? null,
        sub_stimulus: t?.sub_stimulus ?? null,
        purpose_variation: t?.purpose_variation ?? null,
        benchmark_type_id: d?.benchmark_type_id ?? null,
      };
    });
  }, [contactId]);

  return useAsyncState(loader, [contactId], [] as PrRow[], (d) => d.length === 0);
}
