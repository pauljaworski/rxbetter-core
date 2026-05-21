import { describe, expect, it } from "vitest";
import {
  METCON_FORMATS,
  PROGRAMMING_SEGMENTS,
  validateProgrammingEditorInput,
} from "./programmingEditor";
import type { EditorWod } from "./types";

function wod(patch: Partial<EditorWod> = {}): EditorWod {
  return {
    name: "Test segment",
    description: null,
    programming_segment: "metcon",
    metcon_format: "amrap",
    athlete_notes: null,
    coaches_notes: null,
    display_order: 0,
    program_library_id: "library-1",
    items: [],
    ...patch,
  };
}

describe("programming editor contract", () => {
  it("accepts every segment and metcon format exposed by the staff editor", () => {
    const editorWods = PROGRAMMING_SEGMENTS.map((segment, idx) =>
      wod({
        name: segment.label,
        programming_segment: segment.value,
        metcon_format: idx < METCON_FORMATS.length ? METCON_FORMATS[idx] : null,
      }),
    );

    expect(validateProgrammingEditorInput(editorWods)).toBeNull();
  });

  it("rejects unsupported values before any partial save can start", () => {
    expect(validateProgrammingEditorInput([wod({ programming_segment: "unsupported" })])).toContain(
      "unsupported segment",
    );
    expect(validateProgrammingEditorInput([wod({ metcon_format: "unsupported" })])).toContain(
      "unsupported metcon format",
    );
  });
});
