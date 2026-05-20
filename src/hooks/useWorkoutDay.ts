import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "./useAsyncState";
import type { Tables } from "@/types/database";

export type WorkoutLineItem = {
  id: string;
  programming_id: string;
  sequence_number: number | null;
  reps_prescribed: number | null;
  prescribed_percentage: number | null;
  prescribed_weight: number | null;
  prescribed_score: string | null;
  status: string | null;
  benchmark_definition_id: string | null;
  benchmark_type_id: string | null;
  contact_id: string | null;
  bench_name?: string;
  stimulus?: string;
};

export type WorkoutDayProgramming = {
  id: string;
  name: string | null;
  description: string | null;
  athlete_notes: string | null;
  coaches_notes: string | null;
  programming_segment: string | null;
  metcon_format: string | null;
  display_order: number | null;
  wod_date: string;
  prescribed_scale: string | null;
  items: WorkoutLineItem[];
};

export type WorkoutPerformance = Pick<
  Tables<"athlete_performance">,
  "id" | "programming_line_item_id" | "score" | "weight_lifted" | "rpe" | "is_pr" | "workout_scale" | "status" | "result_value"
>;

export type WorkoutDayResult = {
  wodDate: string | null;
  wods: WorkoutDayProgramming[];
  perfByItem: Map<string, WorkoutPerformance>;
};

const EMPTY: WorkoutDayResult = {
  wodDate: null,
  wods: [],
  perfByItem: new Map(),
};

export function useWorkoutDay(activeGymId: string | null, contactId: string | null) {
  const loader = useCallback(async (): Promise<WorkoutDayResult> => {
    if (!activeGymId) return EMPTY;

    const { data: latest, error: latestErr } = await supabase
      .from("programming")
      .select("wod_date")
      .eq("gym_id", activeGymId)
      .eq("source", "gym")
      .order("wod_date", { ascending: false })
      .limit(1);

    if (latestErr) throw new Error(latestErr.message);
    const wodDate = latest?.[0]?.wod_date ?? null;
    if (!wodDate) return { ...EMPTY, wodDate: null };

    const { data: progs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, description, athlete_notes, coaches_notes, programming_segment, metcon_format, display_order, wod_date, prescribed_scale",
      )
      .eq("gym_id", activeGymId)
      .eq("wod_date", wodDate)
      .eq("source", "gym")
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);
    const ids = (progs ?? []).map((p) => p.id);
    if (!ids.length) return { wodDate, wods: [], perfByItem: new Map() };

    const { data: items, error: itemErr } = await supabase
      .from("programming_line_item")
      .select(
        "id, programming_id, sequence_number, reps_prescribed, prescribed_percentage, prescribed_weight, prescribed_score, status, benchmark_definition_id, benchmark_type_id, contact_id",
      )
      .in("programming_id", ids)
      .is("contact_id", null)
      .order("sequence_number", { ascending: true });

    if (itemErr) throw new Error(itemErr.message);

    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await supabase.from("benchmark_type").select("id, name, stimulus").in("id", typeIds)
      : { data: [] as { id: string; name: string; stimulus: string | null }[] };
    const typeMap = new Map((types ?? []).map((t) => [t.id, t]));

    const wods: WorkoutDayProgramming[] = (progs ?? []).map((p) => ({
      ...p,
      items: (items ?? [])
        .filter((i) => i.programming_id === p.id)
        .map((i) => {
          const t = i.benchmark_type_id ? typeMap.get(i.benchmark_type_id) : undefined;
          return {
            ...i,
            bench_name: t?.name,
            stimulus: t?.stimulus ?? undefined,
          };
        }),
    }));

    const perfByItem = new Map<string, WorkoutPerformance>();
    if (contactId && ids.length) {
      const { data: perfs, error: perfErr } = await supabase
        .from("athlete_performance")
        .select(
          "id, programming_line_item_id, score, weight_lifted, rpe, is_pr, workout_scale, status, result_value",
        )
        .eq("contact_id", contactId)
        .in("programming_id", ids);

      if (perfErr) throw new Error(perfErr.message);
      for (const p of perfs ?? []) {
        if (p.programming_line_item_id) perfByItem.set(p.programming_line_item_id, p);
      }
    }

    return { wodDate, wods, perfByItem };
  }, [activeGymId, contactId]);

  return useAsyncState(loader, [activeGymId, contactId], EMPTY, (d) => !d.wodDate || d.wods.length === 0);
}
