import { describe, expect, it } from "vitest";
import {
  cloneEditorWod,
  isSegmentUnsaved,
  mergeServerWodsAfterSave,
  suggestDuplicateScale,
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

describe("mergeServerWodsAfterSave", () => {
  const strength: EditorWod = {
    ...baseWod,
    id: "seg-strength",
    name: "Strength",
    programming_segment: "weightlifting",
    metcon_format: null,
    athlete_notes: "Original strength notes",
    items: [{ ...baseWod.items[0], id: "s1" }],
  };
  const metcon: EditorWod = {
    ...baseWod,
    id: "seg-metcon",
    name: "Fran",
    athlete_notes: "Original Fran notes",
    items: [{ ...baseWod.items[0], id: "m1" }],
  };

  it("keeps dirty edits on other saved segments after saving one", () => {
    const serverStrength: EditorWod = {
      ...strength,
      items: [
        { ...strength.items[0], id: "s1" },
        { ...strength.items[0], id: "s2", sequence_number: 2, reps_prescribed: 5 },
      ],
    };
    const dirtyMetcon: EditorWod = {
      ...metcon,
      athlete_notes: "Scale pull-ups to ring rows",
    };
    const draft = cloneEditorWod(metcon, 2, { prescribedScale: "scaled" });

    const merged = mergeServerWodsAfterSave(
      [serverStrength, metcon],
      [strength, dirtyMetcon, draft],
      [draft],
      "seg-strength",
    );

    expect(merged).toHaveLength(3);
    expect(merged[0].id).toBe("seg-strength");
    expect(merged[0].items).toHaveLength(2);
    expect(merged[1].id).toBe("seg-metcon");
    expect(merged[1].athlete_notes).toBe("Scale pull-ups to ring rows");
    expect(isSegmentUnsaved(merged[2])).toBe(true);
  });

  it("uses the server row for the segment that was just saved", () => {
    const localStale: EditorWod = {
      ...strength,
      name: "Strength (stale local)",
      items: [{ ...strength.items[0], _new: true, id: undefined }],
    };
    const serverFresh: EditorWod = {
      ...strength,
      name: "Strength",
      items: [{ ...strength.items[0], id: "s1-new" }],
    };

    const merged = mergeServerWodsAfterSave([serverFresh, metcon], [localStale, metcon], [], "seg-strength");

    expect(merged[0].items[0].id).toBe("s1-new");
    expect(merged[0].name).toBe("Strength");
    expect(merged[1].id).toBe("seg-metcon");
  });
});
