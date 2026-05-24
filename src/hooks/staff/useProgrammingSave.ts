import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import { normalizeEditorWodFields, validateEditorWod } from "@/lib/programming/manual-config";
import {
  buildDefinitionMap,
  resolveDefinitionId,
  type BenchmarkDefinitionRow,
} from "@/lib/programming/percent-calculator";
import type { EditorLineItem, EditorWod } from "./types";

export async function loadDefinitionMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("benchmark_definition")
    .select("id, benchmark_type_id, rep_count");
  if (error) throw new Error(error.message);
  return buildDefinitionMap((data ?? []) as BenchmarkDefinitionRow[]);
}

function resolveLineItemForSave(
  it: EditorLineItem,
  defMap: Map<string, string>,
): {
  benchmark_definition_id: string | null;
  benchmark_type_id: string | null;
  movement_label: string | null;
  prescribed_weight: number | null;
  prescribed_percentage: number | null;
  prescribed_score: string | null;
  reps_prescribed: number | null;
} {
  const repMax = it.percent_rep_max ?? 1;
  const defId =
    resolveDefinitionId(defMap, it.benchmark_type_id, repMax) ??
    it.benchmark_definition_id ??
    null;
  return {
    reps_prescribed: it.reps_prescribed,
    prescribed_weight: it.prescribed_weight,
    prescribed_percentage: it.prescribed_percentage,
    prescribed_score: it.prescribed_score,
    benchmark_type_id: it.benchmark_type_id,
    benchmark_definition_id: defId,
    movement_label: it.benchmark_type_id ? null : (it.movement_label ?? it.bench_name ?? null),
  };
}

export type SaveWodResult = { programmingId: string | null; error: string | null };

async function syncLibraryAssignments(programmingId: string, libraryIds: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from("programming_library_assignment")
    .delete()
    .eq("programming_id", programmingId);
  if (delErr) throw new Error(delErr.message);
  if (!libraryIds.length) return;
  const { error: insErr } = await supabase.from("programming_library_assignment").insert(
    libraryIds.map((program_library_id) => ({ programming_id: programmingId, program_library_id })),
  );
  if (insErr) throw new Error(insErr.message);
}

async function deleteRemovedSharedLineItems(
  programmingId: string,
  keptLineItemIds: string[],
): Promise<void> {
  let query = supabase
    .from("programming_line_item")
    .delete()
    .eq("programming_id", programmingId)
    .is("contact_id", null);

  if (keptLineItemIds.length) {
    query = query.not("id", "in", `(${keptLineItemIds.join(",")})`);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function saveWod(
  activeGymId: string,
  dateKey: string,
  defaultLib: string,
  wod: EditorWod,
  displayOrder: number,
  defMap: Map<string, string>,
): Promise<SaveWodResult> {
  const normalized = normalizeEditorWodFields({
    ...wod,
    program_library_ids:
      wod.program_library_ids?.length > 0
        ? wod.program_library_ids
        : wod.program_library_id
          ? [wod.program_library_id]
          : [defaultLib],
  });
  const validationErr = validateEditorWod(normalized);
  if (validationErr) return { programmingId: null, error: validationErr };

  const lib =
    normalized.program_library_ids[0] ??
    normalized.program_library_id ??
    defaultLib;
  const libraryIds = normalized.program_library_ids.length
    ? normalized.program_library_ids
    : lib
      ? [lib]
      : [];
  let progId = normalized.id;

  try {
    if (normalized._new || !progId) {
      const { data, error } = await supabase
        .from("programming")
        .insert({
          gym_id: activeGymId,
          program_library_id: lib,
          wod_date: dateKey,
          name: normalized.name,
          description: normalized.description,
          programming_segment: normalized.programming_segment,
          metcon_format: normalized.metcon_format,
          athlete_notes: normalized.athlete_notes,
          coaches_notes: normalized.coaches_notes,
          display_order: displayOrder,
          source: "gym",
          prescribed_scale: "rx",
          created_by_contact_id: null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      progId = data.id;
    } else {
      const { error } = await supabase
        .from("programming")
        .update({
          name: normalized.name,
          description: normalized.description,
          programming_segment: normalized.programming_segment,
          metcon_format: normalized.metcon_format,
          athlete_notes: normalized.athlete_notes,
          coaches_notes: normalized.coaches_notes,
          display_order: displayOrder,
          program_library_id: lib,
        })
        .eq("id", progId);
      if (error) throw new Error(error.message);
    }

    await syncLibraryAssignments(progId!, libraryIds);
    await deleteRemovedSharedLineItems(
      progId!,
      normalized.items.map((it) => it.id).filter(Boolean) as string[],
    );

    for (let j = 0; j < normalized.items.length; j++) {
      const it = normalized.items[j];
      const payload = {
        sequence_number: j + 1,
        ...resolveLineItemForSave(it, defMap),
        contact_id: null,
      };
      if (it._new || !it.id) {
        const { error } = await supabase.from("programming_line_item").insert({
          programming_id: progId,
          ...payload,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("programming_line_item")
          .update(payload)
          .eq("id", it.id)
          .eq("programming_id", progId);
        if (error) throw new Error(error.message);
      }
    }

    return { programmingId: progId, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { programmingId: null, error: formatSupabaseError(msg) };
  }
}

export function useProgrammingSave(
  activeGymId: string | null,
  date: Date,
  defaultLib: string | null,
) {
  const [busy, setBusy] = useState(false);
  const dateKey = format(date, "yyyy-MM-dd");

  async function saveAll(wods: EditorWod[]): Promise<{ error: string | null }> {
    if (!activeGymId) {
      return { error: "No active gym selected." };
    }
    const hasLib = wods.some(
      (w) =>
        (w.program_library_ids?.length ?? 0) > 0 ||
        w.program_library_id != null ||
        defaultLib != null,
    );
    if (!hasLib) {
      return { error: "Each section needs at least one track selected." };
    }

    setBusy(true);
    try {
      const defMap = await loadDefinitionMap();
      for (let i = 0; i < wods.length; i++) {
        const { error } = await saveWod(activeGymId, dateKey, defaultLib, wods[i], i, defMap);
        if (error) throw new Error(error);
      }
      setBusy(false);
      return { error: null };
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : String(e);
      return { error: formatSupabaseError(msg) };
    }
  }

  return {
    saveAll,
    saveWod: async (wod: EditorWod, order: number) => {
      const defMap = await loadDefinitionMap();
      return saveWod(activeGymId!, dateKey, defaultLib!, wod, order, defMap);
    },
    busy,
  };
}
