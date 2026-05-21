import { describe, expect, it } from "vitest";
import { parseWodText } from "./parse-wod-text";
import type { BenchmarkCatalogEntry } from "./types";

const catalog: BenchmarkCatalogEntry[] = [
  { id: "bt-squat", name: "Back Squat", stimulus: "strength" },
  { id: "bt-dead", name: "Deadlift", stimulus: "strength" },
];

describe("parseWodText", () => {
  it("parses Back Squat 5x3 @ 80% as five line items", () => {
    const r = parseWodText({
      rawText: "Back Squat 5x3 @ 80%",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.needsLlmFallback).toBe(false);
    expect(r.draft?.lineItems).toHaveLength(5);
    for (const [i, it] of (r.draft?.lineItems ?? []).entries()) {
      expect(it.sequence_number).toBe(i + 1);
      expect(it.benchmark_type_id).toBe("bt-squat");
      expect(it.reps_prescribed).toBe(3);
      expect(it.prescribed_percentage).toBeCloseTo(0.8);
      expect(it.prescribed_score).toBeNull();
    }
    expect(r.draft?.segment.description).toBe("5x3 @ 80%");
  });

  it("strips stray + before scheme", () => {
    const r = parseWodText({
      rawText: "Back Squat + 5x3 @ 70%",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.draft?.lineItems).toHaveLength(5);
    expect(r.draft?.lineItems[0].prescribed_score).toBeNull();
    expect(r.draft?.segment.name).toBe("Back Squat");
  });

  it("parses percent ladder as one line item per percentage", () => {
    const r = parseWodText({
      rawText: "Back Squat 5x3 65,70,75,80,85%",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.draft?.lineItems).toHaveLength(5);
    expect(r.draft?.lineItems[0].prescribed_percentage).toBeCloseTo(0.65);
    expect(r.draft?.lineItems[4].prescribed_percentage).toBeCloseTo(0.85);
    expect(r.draft?.lineItems[0].prescribed_score).toBeNull();
  });

  it("parses Deadlift 3 @ 225 as single line item", () => {
    const r = parseWodText({
      rawText: "Deadlift 3 @ 225",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.draft?.lineItems).toHaveLength(1);
    expect(r.draft?.lineItems[0].benchmark_type_id).toBe("bt-dead");
    expect(r.draft?.lineItems[0].prescribed_weight).toBe(225);
    expect(r.draft?.lineItems[0].reps_prescribed).toBe(3);
  });

  it("flags unmatched movement", () => {
    const r = parseWodText({
      rawText: "Unknown Lift 5x3 @ 70%",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.draft?.warnings.length).toBeGreaterThan(0);
    expect(r.draft?.lineItems[0].benchmark_type_id).toBeNull();
    expect(r.draft?.lineItems).toHaveLength(5);
  });

  it("marks complex metcon for LLM fallback", () => {
    const r = parseWodText({
      rawText: "AMRAP 12\n10 thrusters\n15 pull-ups",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.needsLlmFallback).toBe(true);
    expect(r.draft?.segment.programming_segment).toBe("metcon");
  });
});
