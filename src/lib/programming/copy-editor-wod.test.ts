import { describe, expect, it } from "vitest";
import { cloneEditorWodForCopy } from "./copy-editor-wod";
import type { EditorWod } from "@/hooks/staff/types";

function sourceWod(): EditorWod {
  return {
    id: "source-programming",
    name: "Part A",
    description: null,
    programming_segment: "metcon",
    metcon_format: "for_time",
    workout_scheme: {},
    segment_group_id: "source-group",
    group_score_anchor: true,
    programming_subtype: null,
    athlete_notes: null,
    coaches_notes: null,
    display_order: 0,
    program_library_id: "track-a",
    program_library_ids: ["track-a"],
    published_at: "2026-05-20T12:00:00Z",
    items: [
      {
        id: "source-line",
        sequence_number: 4,
        reps_prescribed: 21,
        prescribed_weight: null,
        prescribed_percentage: null,
        prescribed_score: null,
        benchmark_type_id: null,
        movement_label: "Wall Balls",
      },
    ],
  };
}

describe("cloneEditorWodForCopy", () => {
  it("creates a new draft without carrying segment group identity", () => {
    const clone = cloneEditorWodForCopy(sourceWod(), 3, "fallback-track");

    expect(clone.id).toBeUndefined();
    expect(clone._new).toBe(true);
    expect(clone.display_order).toBe(3);
    expect(clone.segment_group_id).toBeNull();
    expect(clone.group_score_anchor).toBe(false);
    expect(clone.published_at).toBeNull();
    expect(clone.program_library_ids).toEqual(["track-a"]);
    expect(clone.items[0]).toMatchObject({
      id: undefined,
      _new: true,
      sequence_number: 1,
    });
  });
});
