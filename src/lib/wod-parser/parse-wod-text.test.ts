import { describe, expect, it } from "vitest";
import { parseWodText } from "./parse-wod-text";
import type { BenchmarkCatalogEntry } from "./types";

const catalog: BenchmarkCatalogEntry[] = [
  { id: "bt-squat", name: "Back Squat", stimulus: "strength" },
  { id: "bt-dead", name: "Deadlift", stimulus: "strength" },
];

describe("parseWodText", () => {
  it("parses Back Squat 5x3 @ 80%", () => {
    const r = parseWodText({
      rawText: "Back Squat 5x3 @ 80%",
      catalog,
      defaultLibraryId: "lib-1",
    });
    expect(r.needsLlmFallback).toBe(false);
    expect(r.draft?.lineItems[0].benchmark_type_id).toBe("bt-squat");
    expect(r.draft?.lineItems[0].prescribed_percentage).toBeCloseTo(0.8);
    expect(r.draft?.lineItems[0].reps_prescribed).toBe(3);
    expect(r.draft?.lineItems[0].prescribed_score).toBe("5x3 @ 80%");
  });

  it("parses Deadlift 3 @ 225", () => {
    const r = parseWodText({
      rawText: "Deadlift 3 @ 225",
      catalog,
      defaultLibraryId: "lib-1",
    });
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
