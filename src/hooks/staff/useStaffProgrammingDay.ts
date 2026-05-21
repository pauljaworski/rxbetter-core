import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "../useAsyncState";
import type { EditorWod } from "./types";

async function loadLibraryAssignments(
  programmingIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!programmingIds.length) return map;
  const { data, error } = await supabase
    .from("programming_library_assignment")
    .select("programming_id, program_library_id")
    .in("programming_id", programmingIds);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const list = map.get(row.programming_id) ?? [];
    list.push(row.program_library_id);
    map.set(row.programming_id, list);
  }
  return map;
}

function mapWodsFromRows(
  progs: Array<{
    id: string;
    name: string | null;
    description: string | null;
    programming_segment: string | null;
    metcon_format: string | null;
    athlete_notes: string | null;
    coaches_notes: string | null;
    display_order: number | null;
    program_library_id: string | null;
    published_at: string | null;
  }>,
  items: Array<{
    id: string;
    programming_id: string;
    sequence_number: number | null;
    reps_prescribed: number | null;
    prescribed_weight: number | null;
    prescribed_percentage: number | null;
    prescribed_score: string | null;
    benchmark_type_id: string | null;
    benchmark_definition_id: string | null;
    movement_label: string | null;
  }>,
  typeMap: Map<string, string>,
  assignmentMap: Map<string, string[]>,
  defRepById: Map<string, number>,
  markNew?: boolean,
): EditorWod[] {
  return progs.map((p) => {
    const assignmentIds = assignmentMap.get(p.id) ?? [];
    const libIds =
      assignmentIds.length > 0
        ? assignmentIds
        : p.program_library_id
          ? [p.program_library_id]
          : [];
    return {
      ...(markNew ? { _new: true as const } : { id: p.id }),
      name: p.name,
      description: p.description,
      programming_segment: p.programming_segment ?? "metcon",
      metcon_format: p.metcon_format,
      athlete_notes: p.athlete_notes,
      coaches_notes: p.coaches_notes,
      display_order: p.display_order ?? 0,
      program_library_id: libIds[0] ?? p.program_library_id,
      program_library_ids: libIds,
      published_at: p.published_at,
      items: items
        .filter((i) => i.programming_id === p.id)
        .map((i, idx) => ({
          ...(markNew ? { _new: true as const } : { id: i.id }),
          sequence_number: i.sequence_number ?? idx + 1,
          reps_prescribed: i.reps_prescribed,
          prescribed_weight: i.prescribed_weight,
          prescribed_percentage: i.prescribed_percentage,
          prescribed_score: i.prescribed_score,
          benchmark_type_id: i.benchmark_type_id,
          benchmark_definition_id: i.benchmark_definition_id,
          percent_rep_max: i.benchmark_definition_id
            ? (defRepById.get(i.benchmark_definition_id) ?? 1)
            : 1,
          movement_label: i.movement_label,
          bench_name: i.benchmark_type_id
            ? typeMap.get(i.benchmark_type_id)
            : (i.movement_label ?? undefined),
        })),
    };
  });
}

async function loadDefinitionRepCounts(defIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!defIds.length) return map;
  const { data } = await supabase
    .from("benchmark_definition")
    .select("id, rep_count")
    .in("id", defIds);
  for (const d of data ?? []) map.set(d.id, d.rep_count);
  return map;
}

export function useStaffProgrammingDay(activeGymId: string | null, date: Date) {
  const dateKey = format(date, "yyyy-MM-dd");

  const loader = useCallback(async (): Promise<EditorWod[]> => {
    if (!activeGymId) return [];

    const { data: progs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, description, programming_segment, metcon_format, athlete_notes, coaches_notes, display_order, program_library_id, published_at",
      )
      .eq("gym_id", activeGymId)
      .eq("wod_date", dateKey)
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);

    const ids = (progs ?? []).map((p) => p.id);
    if (!ids.length) return [];

    const assignmentMap = await loadLibraryAssignments(ids);

    const { data: items, error: itemErr } = await supabase
      .from("programming_line_item")
      .select(
        "id, programming_id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id, benchmark_definition_id, movement_label",
      )
      .in("programming_id", ids)
      .is("contact_id", null)
      .order("sequence_number", { ascending: true });

    if (itemErr) throw new Error(itemErr.message);

    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const defIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_definition_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await supabase.from("benchmark_type").select("id, name").in("id", typeIds)
      : { data: [] as { id: string; name: string }[] };
    const typeMap = new Map((types ?? []).map((t) => [t.id, t.name]));
    const defRepById = await loadDefinitionRepCounts(defIds);

    return mapWodsFromRows(progs ?? [], items ?? [], typeMap, assignmentMap, defRepById);
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
      "id, name, description, programming_segment, metcon_format, athlete_notes, coaches_notes, display_order, program_library_id, published_at",
    )
    .eq("gym_id", activeGymId)
    .eq("wod_date", srcKey)
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);
  if (!progs?.length) return [];

  const srcIds = progs.map((p) => p.id);
  const assignmentMap = await loadLibraryAssignments(srcIds);

  const { data: items } = await supabase
    .from("programming_line_item")
    .select(
      "id, programming_id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id, benchmark_definition_id, movement_label",
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
  const defIds = Array.from(
    new Set((items ?? []).map((i) => i.benchmark_definition_id).filter(Boolean) as string[]),
  );
  const defRepById = await loadDefinitionRepCounts(defIds);

  return mapWodsFromRows(progs, items ?? [], typeMap, assignmentMap, defRepById, true);
}

/** Fetch segments for a single date (segment copy picker). */
export async function fetchProgrammingSegmentsForDate(
  activeGymId: string,
  sourceDate: Date,
): Promise<EditorWod[]> {
  return fetchProgrammingDayForCopy(activeGymId, sourceDate);
}
