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
  type MovementComponent,
} from "@/lib/programming/movement-components-schema";
import { defaultLineItemKindForSegment, isLineItemKind } from "@/lib/programming/line-item-kind";
import {
  syncDeletedLineItems,
  syncProgrammingLibraryAssignments,
} from "@/lib/programming/programming-delete";
import {
  rxVariantsForSave,
  syncLegacyFieldsFromVariants,
} from "@/lib/programming/rx-variants-schema";
import { ensureGymBenchmarkType } from "@/lib/programming/gym-benchmark-type";

async function linkCustomMovementsToGymCatalog(
  gymId: string,
  programmingSegment: string,
  items: EditorLineItem[],
): Promise<EditorLineItem[]> {
  const out: EditorLineItem[] = [];
  for (const it of items) {
    if (it.line_item_kind === "rest" || it.line_item_kind === "note") {
      out.push(it);
      continue;
    }

    let next = { ...it };

    if (next.line_item_kind === "complex_set" && next.movement_components?.length) {
      const comps: MovementComponent[] = [];
      for (const c of next.movement_components) {
        if (c.benchmark_type_id || !c.label.trim()) {
          comps.push(c);
          continue;
        }
        const created = await ensureGymBenchmarkType(gymId, c.label, programmingSegment);
        comps.push({ ...c, benchmark_type_id: created.id, label: created.name });
      }
      // Do not invent a PR basis from components — skip_pr_basis / null is intentional.
      next = {
        ...next,
        movement_components: comps,
        benchmark_type_id: next.skip_pr_basis ? null : (next.benchmark_type_id ?? null),
        movement_label: formatComplexMovementTitle(comps, {
          restBetweenSetsSec: next.rest_sec,
        }),
        bench_name: formatComplexMovementTitle(comps, {
          restBetweenSetsSec: next.rest_sec,
        }),
      };
    } else if (!next.benchmark_type_id) {
      const label = (next.movement_label ?? next.bench_name ?? "").trim();
      if (label) {
        const created = await ensureGymBenchmarkType(gymId, label, programmingSegment);
        next = {
          ...next,
          benchmark_type_id: created.id,
          bench_name: created.name,
          movement_label: null,
        };
      }
    }

    out.push(next);
  }
  return out;
}

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
  rx_variants: Json;
  rest_sec: number | null;
} {
  const kind = isLineItemKind(it.line_item_kind ?? "")
    ? it.line_item_kind
    : defaultLineItemKindForSegment(programmingSegment);
  const components = movementComponentsForSave(kind, it.movement_components);
  const repMax = it.percent_rep_max ?? 1;
  const skipPr = it.skip_pr_basis === true;
  // Complex: line-item type is PR basis only (null when skipped). Strength: type is the movement.
  const movementTypeId =
    kind === "rest"
      ? null
      : kind === "complex_set"
        ? skipPr
          ? null
          : (it.benchmark_type_id ?? null)
        : it.benchmark_type_id;
  const usePercent =
    !skipPr &&
    it.prescribed_percentage != null &&
    Number.isFinite(it.prescribed_percentage);
  const defId =
    kind === "rest" || skipPr || !movementTypeId
      ? null
      : usePercent || kind === "strength_set"
        ? (resolveDefinitionId(defMap, movementTypeId, repMax) ??
          it.benchmark_definition_id ??
          null)
        : null;
  const complexLabel =
    kind === "complex_set" && components.length
      ? formatComplexMovementTitle(components, { restBetweenSetsSec: it.rest_sec })
      : null;
  const rxVariants = rxVariantsForSave(it.rx_variants);
  const legacy = syncLegacyFieldsFromVariants({ ...it, rx_variants: rxVariants });
  const restSec =
    kind === "rest"
      ? (it.rest_sec ?? it.reps_prescribed ?? null)
      : (it.rest_sec ?? null);
  return {
    reps_prescribed: kind === "rest" ? restSec : legacy.reps_prescribed,
    prescription_unit:
      kind === "complex_set" || kind === "rest"
        ? null
        : (legacy.prescription_unit ?? it.prescription_unit ?? null),
    prescribed_weight: kind === "rest" ? null : legacy.prescribed_weight,
    prescribed_percentage: kind === "rest" || skipPr || !usePercent ? null : it.prescribed_percentage,
    prescribed_score: kind === "rest" ? null : legacy.prescribed_score,
    benchmark_type_id: movementTypeId,
    benchmark_definition_id: defId,
    movement_label:
      kind === "rest"
        ? "Rest"
        : kind === "complex_set"
          ? complexLabel
          : prTypeId
            ? null
            : (it.movement_label ?? it.bench_name ?? null),
    line_item_kind: kind,
    movement_components: components as unknown as Json,
    rx_variants: rxVariants as unknown as Json,
    rest_sec: restSec,
  };
}

export type SaveWodResult = { programmingId: string | null; error: string | null };

async function syncLibraryAssignments(programmingId: string, libraryIds: string[]): Promise<void> {
  const { error } = await syncProgrammingLibraryAssignments(programmingId, libraryIds);
  if (error) throw new Error(error);
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

  let itemsLinked = normalized.items;
  try {
    itemsLinked = await linkCustomMovementsToGymCatalog(
      activeGymId,
      normalized.programming_segment,
      normalized.items,
    );
  } catch (e) {
    return {
      programmingId: null,
      error: e instanceof Error ? e.message : "Failed to save custom movement to gym library",
    };
  }
  const withLinked: EditorWod = { ...normalized, items: itemsLinked };

  const lib =
    withLinked.program_library_ids[0] ??
    withLinked.program_library_id ??
    defaultLib;
  const libraryIds = withLinked.program_library_ids.length
    ? withLinked.program_library_ids
    : lib
      ? [lib]
      : [];
  let progId = withLinked.id;

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
          prescribed_scale: normalized.prescribed_scale ?? "rx",
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
          program_library_id: lib,
          prescribed_scale: normalized.prescribed_scale ?? "rx",
        })
        .eq("id", progId);
      if (error) throw new Error(error.message);
    }

    await syncLibraryAssignments(progId!, libraryIds);

    const keptIds: string[] = [];
    for (let j = 0; j < withLinked.items.length; j++) {
      const it = withLinked.items[j];
      const payload = {
        sequence_number: j + 1,
        ...resolveLineItemForSave(it, defMap, withLinked.programming_segment),
        contact_id: null,
      };
      if (it._new || !it.id) {
        const { data, error } = await supabase
          .from("programming_line_item")
          .insert({
            programming_id: progId,
            ...payload,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        if (data?.id) keptIds.push(data.id);
      } else {
        const { error } = await supabase
          .from("programming_line_item")
          .update(payload)
          .eq("id", it.id);
        if (error) throw new Error(error.message);
        keptIds.push(it.id);
      }
    }

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
