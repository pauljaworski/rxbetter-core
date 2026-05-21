import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { EditorWod } from "./types";

export function useStaffProgrammingDay(activeGymId: string | null, date: Date) {
  const dateKey = format(date, "yyyy-MM-dd");

  const loader = useCallback(async (): Promise<EditorWod[]> => {
    if (!activeGymId) return [];

    const { data: progs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, description, programming_segment, metcon_format, athlete_notes, coaches_notes, display_order, program_library_id",
      )
      .eq("gym_id", activeGymId)
      .eq("wod_date", dateKey)
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);

    const ids = (progs ?? []).map((p) => p.id);
    if (!ids.length) return [];

    const { data: items, error: itemErr } = await supabase
      .from("programming_line_item")
      .select(
        "id, programming_id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id",
      )
      .in("programming_id", ids)
      .is("contact_id", null)
      .order("sequence_number", { ascending: true });

    if (itemErr) throw new Error(itemErr.message);

    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await supabase.from("benchmark_type").select("id, name").in("id", typeIds)
      : { data: [] as { id: string; name: string }[] };
    const typeMap = new Map((types ?? []).map((t) => [t.id, t.name]));

    return (progs ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      programming_segment: p.programming_segment ?? "metcon",
      metcon_format: p.metcon_format,
      athlete_notes: p.athlete_notes,
      coaches_notes: p.coaches_notes,
      display_order: p.display_order ?? 0,
      program_library_id: p.program_library_id,
      items: (items ?? [])
        .filter((i) => i.programming_id === p.id)
        .map((i, idx) => ({
          id: i.id,
          sequence_number: i.sequence_number ?? idx + 1,
          reps_prescribed: i.reps_prescribed,
          prescribed_weight: i.prescribed_weight,
          prescribed_percentage: i.prescribed_percentage,
          prescribed_score: i.prescribed_score,
          benchmark_type_id: i.benchmark_type_id,
          bench_name: i.benchmark_type_id ? typeMap.get(i.benchmark_type_id) : undefined,
        })),
    }));
  }, [activeGymId, dateKey]);

  return useAsyncState(loader, [activeGymId, dateKey], [] as EditorWod[], (d) => d.length === 0);
}

/** Fetch WODs from another date for duplicate/copy flows. */
export async function fetchProgrammingDayForCopy(
  activeGymId: string,
  sourceDate: Date,
): Promise<EditorWod[]> {
  const srcKey = format(sourceDate, "yyyy-MM-dd");
  const { data: progs, error } = await supabase
    .from("programming")
    .select(
      "id, name, description, programming_segment, metcon_format, athlete_notes, coaches_notes, display_order, program_library_id",
    )
    .eq("gym_id", activeGymId)
    .eq("wod_date", srcKey)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  if (!progs?.length) return [];

  const srcIds = progs.map((p) => p.id);
  const { data: items } = await supabase
    .from("programming_line_item")
    .select(
      "programming_id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id",
    )
    .in("programming_id", srcIds)
    .is("contact_id", null)
    .order("sequence_number", { ascending: true });

  const typeIds = Array.from(
    new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
  );
  const { data: types } = typeIds.length
    ? await supabase.from("benchmark_type").select("id, name").in("id", typeIds)
    : { data: [] as { id: string; name: string }[] };
  const typeMap = new Map((types ?? []).map((t) => [t.id, t.name]));

  return progs.map((p) => ({
    name: p.name,
    description: p.description,
    programming_segment: p.programming_segment ?? "metcon",
    metcon_format: p.metcon_format,
    athlete_notes: p.athlete_notes,
    coaches_notes: p.coaches_notes,
    display_order: p.display_order ?? 0,
    program_library_id: p.program_library_id,
    items: (items ?? [])
      .filter((i) => i.programming_id === p.id)
      .map((i, j) => ({
        _new: true as const,
        sequence_number: j + 1,
        reps_prescribed: i.reps_prescribed,
        prescribed_weight: i.prescribed_weight,
        prescribed_percentage: i.prescribed_percentage,
        prescribed_score: i.prescribed_score,
        benchmark_type_id: i.benchmark_type_id,
        bench_name: i.benchmark_type_id ? typeMap.get(i.benchmark_type_id) : undefined,
      })),
  }));
}
