import type { EditorWod } from "@/hooks/staff/types";

export function cloneEditorWodForCopy(
  src: EditorWod,
  displayOrder: number,
  defaultLib: string | null,
): EditorWod {
  const libraryIds =
    src.program_library_ids?.length > 0
      ? src.program_library_ids
      : defaultLib
        ? [defaultLib]
        : [];

  return {
    ...src,
    id: undefined,
    _new: true,
    display_order: displayOrder,
    segment_group_id: null,
    group_score_anchor: false,
    program_library_id: libraryIds[0] ?? src.program_library_id,
    program_library_ids: libraryIds,
    published_at: null,
    items: src.items.map((it, j) => ({
      ...it,
      _new: true,
      id: undefined,
      sequence_number: j + 1,
    })),
  };
}
