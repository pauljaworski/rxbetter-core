import { describe, expect, it } from "vitest";
import {
  cloneEditorWod,
  suggestDuplicateScale,
  isSegmentUnsaved,
  pendingDraftsAfterPartialSave,
} from "@/lib/programming/staff-programming-state";
import type { EditorWod } from "@/hooks/staff/types";

const baseWod: EditorWod = {
  id: "seg-1",
  name: "Metcon",
  description: "test",
  programming_segment: "metcon",
  metcon_format: "for_time",
  athlete_notes: null,
  coaches_notes: null,
  display_order: 0,
  program_library_id: "lib-1",
  program_library_ids: ["lib-1"],
  published_at: "2024-01-01T00:00:00Z",
  prescribed_scale: "rx",
  items: [
    {
      id: "item-1",
      sequence_number: 1,
      reps_prescribed: 21,
      prescribed_weight: null,
      prescribed_percentage: null,
      prescribed_score: null,
      benchmark_type_id: null,
    },
  ],
};

describe("suggestDuplicateScale", () => {
  it("steps down Rx to Scaled", () => {
    expect(suggestDuplicateScale("rx")).toBe("scaled");
    expect(suggestDuplicateScale("rx_plus")).toBe("rx");
  });
});

describe("cloneEditorWod", () => {
  it("creates unsaved copy with new item ids", () => {
    const clone = cloneEditorWod(baseWod, 1, { prescribedScale: "scaled" });
    expect(isSegmentUnsaved(clone)).toBe(true);
    expect(clone.id).toBeUndefined();
    expect(clone.published_at).toBeNull();
    expect(clone.prescribed_scale).toBe("scaled");
    expect(clone.items[0].id).toBeUndefined();
    expect(clone.items[0]._new).toBe(true);
  });
});

describe("pendingDraftsAfterPartialSave", () => {
  it("drops drafts that already inserted so Publish Day retry cannot duplicate them", () => {
    const first = cloneEditorWod(baseWod, 0, { prescribedScale: "rx" });
    const second = cloneEditorWod(baseWod, 1, { prescribedScale: "scaled" });
    second.name = "Broken metcon";
    const existing: EditorWod = { ...baseWod, display_order: 2 };

    const pending = pendingDraftsAfterPartialSave([first, second, existing], new Set([0]));

    expect(pending).toHaveLength(1);
    expect(pending[0].name).toBe("Broken metcon");
    expect(pending.every((w) => isSegmentUnsaved(w))).toBe(true);
  });

  it("keeps all unsaved drafts when nothing was persisted", () => {
    const a = cloneEditorWod(baseWod, 0);
    const b = cloneEditorWod(baseWod, 1);
    const pending = pendingDraftsAfterPartialSave([a, b], new Set());
    expect(pending).toHaveLength(2);
  });
});
