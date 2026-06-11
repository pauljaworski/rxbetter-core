import { describe, expect, it } from "vitest";
import { isSegmentUnsaved } from "./staff-programming-state";
import type { EditorWod } from "@/hooks/staff/types";

const base: EditorWod = {
  name: "Test",
  description: null,
  programming_segment: "metcon",
  metcon_format: "amrap",
  athlete_notes: null,
  coaches_notes: null,
  display_order: 0,
  program_library_id: "lib-1",
  program_library_ids: ["lib-1"],
  items: [],
};

describe("isSegmentUnsaved", () => {
  it("flags new segments without id", () => {
    expect(isSegmentUnsaved({ ...base, _new: true })).toBe(true);
  });

  it("flags segments missing id", () => {
    expect(isSegmentUnsaved(base)).toBe(true);
  });

  it("returns false for persisted segments", () => {
    expect(isSegmentUnsaved({ ...base, id: "prog-1" })).toBe(false);
  });
});
