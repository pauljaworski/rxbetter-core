import type { EditorWod } from "@/hooks/staff/types";
import type { PrescribedLevel } from "@/lib/format";
import { defaultSchemeForKind } from "@/lib/programming/workout-scheme-schema";

/** Segment exists only in local editor state (not yet in the database). */
export function isSegmentUnsaved(wod: EditorWod): boolean {
  return wod._new === true || !wod.id;
}

/** Suggest the next prescribed tier when duplicating (e.g. Rx → Scaled). */
export function suggestDuplicateScale(scale?: PrescribedLevel): PrescribedLevel {
  if (scale === "rx_plus") return "rx";
  if (scale === "rx" || scale === "fx") return "scaled";
  return scale ?? "rx";
}

/** Deep-clone a segment for same-day or cross-day duplication (new ids, unpublished). */
export function cloneEditorWod(
  src: EditorWod,
  displayOrder: number,
  options?: { prescribedScale?: PrescribedLevel },
): EditorWod {
  return {
    ...src,
    _new: true,
    id: undefined,
    published_at: null,
    display_order: displayOrder,
    prescribed_scale: options?.prescribedScale ?? src.prescribed_scale,
    items: src.items.map((it, j) => ({
      ...it,
      _new: true,
      id: undefined,
      sequence_number: j + 1,
    })),
  };
}

/**
 * Link `wodIdx` with the previous segment under one `segment_group_id`.
 * Creates a group on the previous row if it is not already in a block.
 */
export function linkSegmentWithPrevious(wods: EditorWod[], wodIdx: number): EditorWod[] {
  if (wodIdx <= 0 || wodIdx >= wods.length) return wods;
  const prior = wods[wodIdx - 1];
  const groupId = prior.segment_group_id ?? crypto.randomUUID();

  const next = wods.map((w, i) => {
    if (i === wodIdx - 1) {
      return { ...w, segment_group_id: groupId };
    }
    if (i === wodIdx) {
      return { ...w, segment_group_id: groupId, group_score_anchor: false };
    }
    if (prior.segment_group_id && w.segment_group_id === prior.segment_group_id) {
      return { ...w, segment_group_id: groupId };
    }
    return w;
  });

  const hasAnchor = next.some(
    (w) => w.segment_group_id === groupId && w.group_score_anchor,
  );
  if (hasAnchor) return next;

  return next.map((w, i) =>
    i === wodIdx - 1 ? { ...w, group_score_anchor: true } : w,
  );
}

function emptyMetconDraft(
  displayOrder: number,
  libIds: string[],
  opts: {
    name: string;
    formatKind: "for_time" | "rft";
    segmentGroupId: string;
    groupScoreAnchor: boolean;
    rounds?: number;
  },
): EditorWod {
  let scheme = defaultSchemeForKind(opts.formatKind);
  if (scheme.kind === "rft" && opts.rounds) {
    scheme = { ...scheme, rounds: opts.rounds };
  }
  return {
    _new: true,
    name: opts.name,
    description: null,
    programming_segment: "metcon",
    metcon_format: "for_time",
    workout_scheme: scheme,
    segment_group_id: opts.segmentGroupId,
    group_score_anchor: opts.groupScoreAnchor,
    programming_subtype: null,
    athlete_notes: null,
    coaches_notes: null,
    display_order: displayOrder,
    program_library_id: libIds[0] ?? null,
    program_library_ids: libIds,
    prescribed_scale: "rx",
    published_at: null,
    items: [],
  };
}

/** Three linked drafts: buy-in → main RFT (score anchor) → cash-out. */
export function createBuyInMainCashOutDrafts(
  displayOrderStart: number,
  libIds: string[],
): EditorWod[] {
  const groupId = crypto.randomUUID();
  return [
    emptyMetconDraft(displayOrderStart, libIds, {
      name: "Buy-in",
      formatKind: "for_time",
      segmentGroupId: groupId,
      groupScoreAnchor: false,
    }),
    emptyMetconDraft(displayOrderStart + 1, libIds, {
      name: "Main (e.g. 5 RFT)",
      formatKind: "rft",
      segmentGroupId: groupId,
      groupScoreAnchor: true,
      rounds: 5,
    }),
    emptyMetconDraft(displayOrderStart + 2, libIds, {
      name: "Cash-out",
      formatKind: "for_time",
      segmentGroupId: groupId,
      groupScoreAnchor: false,
    }),
  ];
}

export type ProgrammingUnit =
  | { kind: "single"; indices: number[] }
  | { kind: "group"; groupId: string; indices: number[] };

/** Contiguous singles / multi-part blocks in current editor order. */
export function buildProgrammingUnits(wods: EditorWod[]): ProgrammingUnit[] {
  const units: ProgrammingUnit[] = [];
  let i = 0;
  while (i < wods.length) {
    const gid = wods[i].segment_group_id;
    if (!gid) {
      units.push({ kind: "single", indices: [i] });
      i += 1;
      continue;
    }
    const indices: number[] = [i];
    i += 1;
    while (i < wods.length && wods[i].segment_group_id === gid) {
      indices.push(i);
      i += 1;
    }
    units.push({ kind: "group", groupId: gid, indices });
  }
  return units;
}

function withRenumberedOrder(wods: EditorWod[]): EditorWod[] {
  return wods.map((w, i) => ({ ...w, display_order: i }));
}

function swapAdjacent(wods: EditorWod[], a: number, b: number): EditorWod[] {
  if (a < 0 || b < 0 || a >= wods.length || b >= wods.length || a === b) return wods;
  const next = [...wods];
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return withRenumberedOrder(next);
}

export function canMoveSegment(
  wods: EditorWod[],
  wodIdx: number,
  direction: "up" | "down",
): boolean {
  if (wodIdx < 0 || wodIdx >= wods.length) return false;
  const units = buildProgrammingUnits(wods);
  const unitIdx = units.findIndex((u) => u.indices.includes(wodIdx));
  if (unitIdx < 0) return false;
  const unit = units[unitIdx];
  const posInUnit = unit.indices.indexOf(wodIdx);
  const dir = direction === "up" ? -1 : 1;

  if (unit.kind === "group") {
    const targetPos = posInUnit + dir;
    if (targetPos >= 0 && targetPos < unit.indices.length) return true;
  }

  const targetUnit = unitIdx + dir;
  return targetUnit >= 0 && targetUnit < units.length;
}

/**
 * Move a segment up/down for the day.
 * - Inside a multi-part block: reorders parts within the block.
 * - At a block edge (or for a single): moves the whole unit past the neighboring unit.
 */
export function moveSegmentInDay(
  wods: EditorWod[],
  wodIdx: number,
  direction: "up" | "down",
): EditorWod[] {
  if (!canMoveSegment(wods, wodIdx, direction)) return wods;
  const dir = direction === "up" ? -1 : 1;
  const units = buildProgrammingUnits(wods);
  const unitIdx = units.findIndex((u) => u.indices.includes(wodIdx));
  const unit = units[unitIdx];
  const posInUnit = unit.indices.indexOf(wodIdx);

  if (unit.kind === "group") {
    const targetPos = posInUnit + dir;
    if (targetPos >= 0 && targetPos < unit.indices.length) {
      return swapAdjacent(wods, unit.indices[posInUnit], unit.indices[targetPos]);
    }
  }

  const targetUnitIdx = unitIdx + dir;
  if (targetUnitIdx < 0 || targetUnitIdx >= units.length) return wods;

  const reorderedUnits = [...units];
  const tmp = reorderedUnits[unitIdx];
  reorderedUnits[unitIdx] = reorderedUnits[targetUnitIdx];
  reorderedUnits[targetUnitIdx] = tmp;

  const flattened: EditorWod[] = [];
  for (const u of reorderedUnits) {
    for (const idx of u.indices) {
      flattened.push(wods[idx]);
    }
  }
  return withRenumberedOrder(flattened);
}

/** Swap a line item with its neighbor and renumber sequence_number. */
export function reorderLineItems<T extends { sequence_number: number }>(
  items: T[],
  itemIdx: number,
  direction: "up" | "down",
): T[] {
  const target = direction === "up" ? itemIdx - 1 : itemIdx + 1;
  if (itemIdx < 0 || itemIdx >= items.length) return items;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const tmp = next[itemIdx];
  next[itemIdx] = next[target];
  next[target] = tmp;
  return next.map((it, i) => ({ ...it, sequence_number: i + 1 }));
}

export function canReorderLineItem(
  itemCount: number,
  itemIdx: number,
  direction: "up" | "down",
): boolean {
  if (itemIdx < 0 || itemIdx >= itemCount) return false;
  return direction === "up" ? itemIdx > 0 : itemIdx < itemCount - 1;
}
