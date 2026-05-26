import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/format";
import { normalizeEditorWodFields, validateEditorWod } from "@/lib/programming/manual-config";
import { normalizeWorkoutSchemeForSave } from "@/lib/programming/workout-scheme-schema";
import {
  buildDefinitionMap,
  resolveDefinitionId,
  type BenchmarkDefinitionRow,
} from "@/lib/programming/percent-calculator";
import type { EditorLineItem, EditorWod } from "./types";
import type { Json } from "@/types/database";
import {
  formatComplexMovementTitle,
  movementComponentsForSave,
} from "@/lib/programming/movement-components-schema";
import { defaultLineItemKindForSegment, isLineItemKind } from "@/lib/programming/line-item-kind";
import { syncDeletedLineItems } from "@/lib/programming/programming-delete";

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
  programmingSegment: string,
): {
  benchmark_definition_id: string | null;
  benchmark_type_id: string | null;
  movement_label: string | null;
  prescribed_weight: number | null;
  prescribed_percentage: number | null;
  prescribed_score: string | null;
  reps_prescribed: number | null;
  prescription_unit: string | null;
  line_item_kind: string;
  movement_components: Json;
} {
  const kind = isLineItemKind(it.line_item_kind ?? "")
    ? it.line_item_kind
    : defaultLineItemKindForSegment(programmingSegment);
  const components = movementComponentsForSave(kind, it.movement_components);
  const repMax = it.percent_rep_max ?? 1;
  const prTypeId =
    kind === "complex_set" && components.length
      ? (components.find((c) => c.benchmark_type_id)?.benchmark_type_id ??
        it.benchmark_type_id)
      : it.benchmark_type_id;
  const defId =
    resolveDefinitionId(defMap, prTypeId, repMax) ?? it.benchmark_definition_id ?? null;
  const complexLabel =
    kind === "complex_set" && components.length
      ? formatComplexMovementTitle(components)
      : null;
  return {
    reps_prescribed: it.reps_prescribed,
    prescription_unit: it.prescription_unit ?? null,
    prescribed_weight: it.prescribed_weight,
    prescribed_percentage: it.prescribed_percentage,
    prescribed_score: it.prescribed_score,
    benchmark_type_id: prTypeId,
    benchmark_definition_id: defId,
    movement_label:
      kind === "complex_set"
        ? complexLabel
        : prTypeId
          ? null
          : (it.movement_label ?? it.bench_name ?? null),
    line_item_kind: kind,
    movement_components: components as unknown as Json,
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
          workout_scheme: normalizeWorkoutSchemeForSave(
            normalized.workout_scheme,
            normalized.metcon_format,
          ) as Json,
          segment_group_id: normalized.segment_group_id ?? null,
          group_score_anchor: normalized.group_score_anchor ?? false,
          programming_subtype: normalized.programming_subtype ?? null,
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
          workout_scheme: normalizeWorkoutSchemeForSave(
            normalized.workout_scheme,
            normalized.metcon_format,
          ) as Json,
          segment_group_id: normalized.segment_group_id ?? null,
          group_score_anchor: normalized.group_score_anchor ?? false,
          programming_subtype: normalized.programming_subtype ?? null,
          athlete_notes: normalized.athlete_notes,
          coaches_notes: normalized.coaches_notes,
          display_order: displayOrder,
          program_library_id: lib,
        })
        .eq("id", progId);
      if (error) throw new Error(error.message);
    }

    await syncLibraryAssignments(progId!, libraryIds);

    for (let j = 0; j < normalized.items.length; j++) {
      const it = normalized.items[j];
      const payload = {
        sequence_number: j + 1,
        ...resolveLineItemForSave(it, defMap, normalized.programming_segment),
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
          .eq("id", it.id);
        if (error) throw new Error(error.message);
      }
    }

    const keptIds = normalized.items.map((it) => it.id).filter((id): id is string => !!id);
    const { error: syncErr } = await syncDeletedLineItems(progId!, keptIds);
    if (syncErr) throw new Error(syncErr);

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
