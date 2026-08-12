import { describe, expect, it } from "vitest";
import {
  cloneEditorWod,
  collectUnsavedDrafts,
  suggestDuplicateScale,
  isSegmentUnsaved,
  shouldHoldServerSync,
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

describe("collectUnsavedDrafts", () => {
  it("keeps Duplicate clones and excludes a removed index", () => {
    const saved = baseWod;
    const clone = cloneEditorWod(baseWod, 1, { prescribedScale: "scaled" });
    const drafts = collectUnsavedDrafts([saved, clone], { excludeIndex: 0 });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toBe(clone);
  });

  it("returns every unsaved segment when no index is excluded", () => {
    const a = cloneEditorWod(baseWod, 0);
    const b = cloneEditorWod(baseWod, 1);
    expect(collectUnsavedDrafts([baseWod, a, b])).toEqual([a, b]);
  });
});

describe("shouldHoldServerSync", () => {
  it("waits until a requested refetch is in flight", () => {
    expect(shouldHoldServerSync(true, false, false)).toBe("wait");
    expect(shouldHoldServerSync(true, false, true)).toBe("arm");
    expect(shouldHoldServerSync(false, false, true)).toBe("wait");
    expect(shouldHoldServerSync(false, false, false)).toBe("ready");
  });
});
