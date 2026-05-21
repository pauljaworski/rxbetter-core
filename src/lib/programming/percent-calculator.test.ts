import { describe, expect, it } from "vitest";
import {
  buildDefinitionMap,
  computeWeightFromPr,
  resolveDefinitionId,
} from "./percent-calculator";

describe("percent-calculator", () => {
  it("computes prescribed weight from PR and percentage", () => {
    expect(computeWeightFromPr(300, 0.8)).toBe(240);
    expect(computeWeightFromPr(null, 0.8)).toBeNull();
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
