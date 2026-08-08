import type { EditorWod } from "@/hooks/staff/types";
import type { PrescribedLevel } from "@/lib/format";

export type ServerSyncMode = "date" | "save" | null;

/** Segment exists only in local editor state (not yet in the database). */
export function isSegmentUnsaved(wod: EditorWod): boolean {
  return wod._new === true || !wod.id;
}

/**
 * True while Staff Programming is waiting to apply a fresh day/gym payload.
 * `serverSyncMode === "date"` covers the gap before useAsyncState flips to
 * refreshing after an active-gym switch.
 */
export function isContextTransitionPending(serverSyncMode: ServerSyncMode): boolean {
  return serverSyncMode === "date";
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
