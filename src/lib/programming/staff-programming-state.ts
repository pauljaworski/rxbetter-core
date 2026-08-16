import type { EditorWod } from "@/hooks/staff/types";
import type { PrescribedLevel } from "@/lib/format";

/** Segment exists only in local editor state (not yet in the database). */
export function isSegmentUnsaved(wod: EditorWod): boolean {
  return wod._new === true || !wod.id;
}

/**
 * After saving one section, refetch must not replace dirty edits on other
 * already-saved segments. Take the server row for the segment that was just
 * saved (so new line-item ids land), keep local editor state for every other
 * saved id, then append unsaved drafts.
 */
export function mergeServerWodsAfterSave(
  serverWods: EditorWod[],
  localWods: EditorWod[],
  unsavedDrafts: EditorWod[],
  savedProgrammingId: string | null,
): EditorWod[] {
  const localById = new Map<string, EditorWod>();
  for (const wod of localWods) {
    if (wod.id) localById.set(wod.id, wod);
  }
  const merged = serverWods.map((server) => {
    if (!server.id || server.id === savedProgrammingId) return server;
    return localById.get(server.id) ?? server;
  });
  return [...merged, ...unsavedDrafts];
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
