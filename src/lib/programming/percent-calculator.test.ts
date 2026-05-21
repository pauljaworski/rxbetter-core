import { describe, expect, it } from "vitest";
import {
  buildDefinitionMap,
  computeWeightFromPr,
  normalizePercentFraction,
  percentFractionFromWhole,
  percentWholeFromFraction,
  resolveDefinitionId,
} from "./percent-calculator";

describe("percent-calculator", () => {
  it("computes prescribed weight from PR and percentage", () => {
    expect(computeWeightFromPr(300, 0.8)).toBe(240);
    expect(computeWeightFromPr(null, 0.8)).toBeNull();
  });

  it("rounds percent display and storage to whole numbers", () => {
    expect(percentWholeFromFraction(0.799999999)).toBe(80);
    expect(percentFractionFromWhole(80)).toBe(0.8);
    expect(normalizePercentFraction(0.649999)).toBe(0.65);
  });

  it("resolves benchmark_definition_id by type and rep count", () => {
    const map = buildDefinitionMap([
      { id: "def-1", benchmark_type_id: "bt-squat", rep_count: 1 },
      { id: "def-2", benchmark_type_id: "bt-squat", rep_count: 3 },
    ]);
    expect(resolveDefinitionId(map, "bt-squat", 1)).toBe("def-1");
    expect(resolveDefinitionId(map, "bt-squat", 3)).toBe("def-2");
  });
});
