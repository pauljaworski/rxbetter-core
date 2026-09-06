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
