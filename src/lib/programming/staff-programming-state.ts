import type { EditorWod } from "@/hooks/staff/types";
import type { PrescribedLevel } from "@/lib/format";

export type ServerSyncMode = "date" | "save" | null;

/** Segment exists only in local editor state (not yet in the database). */
export function isSegmentUnsaved(wod: EditorWod): boolean {
  return wod._new === true || !wod.id;
}

/**
 * Unsaved editor drafts to re-attach after a server refetch.
 * Used so delete / save / intake sync does not silently discard Duplicate clones
 * or brand-new segments that never hit the database.
 */
export function collectUnsavedDrafts(
  wods: EditorWod[],
  options?: { excludeIndex?: number },
): EditorWod[] {
  return wods.filter((w, i) => {
    if (options?.excludeIndex != null && i === options.excludeIndex) return false;
    return isSegmentUnsaved(w);
  });
}

/**
 * After requesting a save-mode refetch, wait until the fetch is in flight before
 * applying server rows — otherwise a stale snapshot can wipe local drafts.
 */
export function shouldHoldServerSync(
  awaitingRefetch: boolean,
  isLoading: boolean,
  isRefreshing: boolean,
): "wait" | "arm" | "ready" {
  if (awaitingRefetch) {
    if (!(isLoading || isRefreshing)) return "wait";
    return "arm";
  }
  if (isLoading || isRefreshing) return "wait";
  return "ready";
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
