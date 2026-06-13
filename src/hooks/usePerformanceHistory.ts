import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { WorkoutScale } from "@/lib/format";
import type { Json } from "@/types/database";
import { useAsyncState } from "./useAsyncState";

export type PerformanceHistoryRow = {
  id: string;
  performance_date: string | null;
  created_at: string;
  score: string | null;
  weight_lifted: number | null;
  is_pr: boolean;
  programming_id: string | null;
  benchmark_type_id: string | null;
  benchmark_definition_id: string | null;
  reps_prescribed: number | null;
  workout_scale: WorkoutScale | null;
  score_meta: Json | null;
  wod_name?: string;
  bench_name?: string;
  stimulus: string | null;
  sub_stimulus: string | null;
  purpose_variation: string | null;
  rep_count: number | null;
};

export function usePerformanceHistory(contactId: string | null, limit = 100) {
  const loader = useCallback(async (): Promise<PerformanceHistoryRow[]> => {
    if (!contactId) return [];

    const { data: perf, error } = await supabase
      .from("athlete_performance")
      .select(
        "id, performance_date, created_at, score, weight_lifted, is_pr, programming_id, benchmark_type_id, benchmark_definition_id, reps_prescribed, workout_scale, score_meta",
      )
      .eq("contact_id", contactId)
      .order("performance_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    const progIds = Array.from(
      new Set((perf ?? []).map((p) => p.programming_id).filter(Boolean) as string[]),
    );
    const typeIds = Array.from(
      new Set((perf ?? []).map((p) => p.benchmark_type_id).filter(Boolean) as string[]),
    );
    const defIds = Array.from(
      new Set((perf ?? []).map((p) => p.benchmark_definition_id).filter(Boolean) as string[]),
    );

    const [{ data: progs }, { data: types }, { data: defs }] = await Promise.all([
      progIds.length
        ? supabase.from("programming").select("id, name").in("id", progIds)
        : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),
      typeIds.length
        ? supabase
            .from("benchmark_type")
            .select("id, name, stimulus, sub_stimulus, purpose_variation")
            .in("id", typeIds)
        : Promise.resolve({
            data: [] as {
              id: string;
              name: string;
              stimulus: string | null;
              sub_stimulus: string | null;
              purpose_variation: string | null;
            }[],
          }),
      defIds.length
        ? supabase.from("benchmark_definition").select("id, rep_count").in("id", defIds)
        : Promise.resolve({ data: [] as { id: string; rep_count: number }[] }),
    ]);

    const progMap = new Map((progs ?? []).map((p) => [p.id, p.name]));
    const typeMap = new Map((types ?? []).map((t) => [t.id, t]));
    const defMap = new Map((defs ?? []).map((d) => [d.id, d]));

    return (perf ?? []).map((p) => {
      const t = p.benchmark_type_id ? typeMap.get(p.benchmark_type_id) : undefined;
      const d = p.benchmark_definition_id ? defMap.get(p.benchmark_definition_id) : undefined;
      const scale = p.workout_scale;
      const workoutScale =
        scale === "rx_plus" || scale === "rx" || scale === "fx" || scale === "scaled"
          ? scale
          : null;
      return {
        ...p,
        workout_scale: workoutScale,
        wod_name: p.programming_id ? (progMap.get(p.programming_id) ?? undefined) : undefined,
        bench_name: t?.name ?? undefined,
        stimulus: t?.stimulus ?? null,
        sub_stimulus: t?.sub_stimulus ?? null,
        purpose_variation: t?.purpose_variation ?? null,
        rep_count: d?.rep_count ?? null,
      };
    });
  }, [contactId, limit]);

  return useAsyncState(loader, [contactId, limit], [] as PerformanceHistoryRow[], (d) => d.length === 0);
}
