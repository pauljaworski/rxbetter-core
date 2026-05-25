import { describe, expect, it } from "vitest";
import {
  filterBenchmarkCatalog,
  getLineItemMode,
  isNamedBenchmarkWod,
  normalizeEditorWodFields,
  resolveProgrammingUiKey,
  validateEditorWod,
} from "./manual-config";
import type { EditorWod } from "@/hooks/staff/types";

const catalog = [
  { id: "1", name: "Snatch", stimulus: "strength", sub_stimulus: "snatch" },
  { id: "2", name: "Fran", stimulus: "metcon", purpose_variation: "Girl" },
  { id: "3", name: "Wall Ball", stimulus: "strength", sub_stimulus: "squat" },
  { id: "4", name: "Muscle-up", stimulus: "skill" },
];

function baseWod(overrides: Partial<EditorWod> = {}): EditorWod {
  return {
    name: "Test",
    description: null,
    programming_segment: "metcon",
    metcon_format: "for_time",
    athlete_notes: null,
    coaches_notes: null,
    display_order: 0,
    program_library_id: "lib-1",
    program_library_ids: ["lib-1"],
    items: [{ sequence_number: 1, reps_prescribed: 10, prescribed_weight: null, prescribed_percentage: null, prescribed_score: null, benchmark_type_id: "3", bench_name: "Wall Ball" }],
    ...overrides,
  };
}

describe("manual-config", () => {
  it("excludes named benchmark WODs from metcon movement list", () => {
    const filtered = filterBenchmarkCatalog(catalog, "metcon");
    expect(filtered.map((e) => e.name)).not.toContain("Fran");
    expect(filtered.map((e) => e.name)).toContain("Snatch");
  });

  it("weightlifting filter keeps strength movements", () => {
    const filtered = filterBenchmarkCatalog(catalog, "weightlifting");
    expect(filtered.map((e) => e.name)).toEqual(["Snatch", "Wall Ball"]);
  });

  it("detects named benchmark WODs", () => {
    expect(isNamedBenchmarkWod({ id: "2", name: "Fran", stimulus: "metcon" })).toBe(true);
    expect(isNamedBenchmarkWod({ id: "1", name: "Snatch", stimulus: "strength" })).toBe(false);
  });

  it("metcon uses tracking_only line item mode", () => {
    expect(getLineItemMode("metcon")).toBe("tracking_only");
    expect(getLineItemMode("weightlifting")).toBe("prescription");
  });

  it("validateEditorWod requires name, items, libraries, metcon format", () => {
    expect(validateEditorWod(baseWod())).toBeNull();
    expect(validateEditorWod(baseWod({ name: "" }))).toMatch(/name/i);
    expect(validateEditorWod(baseWod({ items: [] }))).toMatch(/line item/i);
    expect(validateEditorWod(baseWod({ metcon_format: null }))).toMatch(/format/i);
    expect(
      validateEditorWod(baseWod({ program_library_ids: [], program_library_id: null })),
    ).toMatch(/track/i);
  });

  it("resolveProgrammingUiKey keeps weightlifting vs strength distinct", () => {
    expect(
      resolveProgrammingUiKey({
        programming_segment: "weightlifting",
        metcon_format: null,
        programming_subtype: "weightlifting",
      }),
    ).toBe("weightlifting");
    expect(
      resolveProgrammingUiKey({
        programming_segment: "weightlifting",
        metcon_format: null,
        programming_subtype: "strength",
      }),
    ).toBe("strength");
  });

  it("normalizeEditorWodFields clears prescribed_score for metcon", () => {
    const w = normalizeEditorWodFields(
      baseWod({
        items: [
          {
            sequence_number: 1,
            reps_prescribed: 10,
            prescribed_weight: null,
            prescribed_percentage: null,
            prescribed_score: "5:00",
            benchmark_type_id: "3",
          },
        ],
      }),
    );
    expect(w.items[0].prescribed_score).toBeNull();
  });
});
