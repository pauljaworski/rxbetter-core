import { describe, expect, it } from "vitest";
import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import { buildDefinitionMap } from "./percent-calculator";
import {
  enrichLogLineItemsWithMap,
  needsDefaultPrDefinition,
} from "./enrich-line-items";

function line(overrides: Partial<LogLineItem>): LogLineItem {
  return {
    id: "i1",
    sequence_number: 1,
    reps_prescribed: 5,
    prescribed_percentage: null,
    prescribed_weight: 185,
    prescribed_score: null,
    status: null,
    benchmark_definition_id: null,
    benchmark_type_id: "bt-squat",
    line_item_kind: "strength_set",
    ...overrides,
  };
}

const defMap = buildDefinitionMap([
  { id: "def-squat-1rm", benchmark_type_id: "bt-squat", rep_count: 1 },
]);

describe("enrichLogLineItemsWithMap", () => {
  it("does not invent a 1RM for skip-% strength sets (type, no %, no definition)", () => {
    const items = [line({ prescribed_percentage: null, benchmark_definition_id: null })];
    expect(needsDefaultPrDefinition(items[0])).toBe(false);
    expect(enrichLogLineItemsWithMap(items, defMap)[0].benchmark_definition_id).toBeNull();
  });

  it("fills 1RM when a % of PR is prescribed but definition is missing", () => {
    const items = [line({ prescribed_percentage: 0.75, benchmark_definition_id: null })];
    expect(needsDefaultPrDefinition(items[0])).toBe(true);
    expect(enrichLogLineItemsWithMap(items, defMap)[0].benchmark_definition_id).toBe(
      "def-squat-1rm",
    );
  });

  it("leaves an already-bound definition unchanged", () => {
    const items = [
      line({
        prescribed_percentage: 0.8,
        benchmark_definition_id: "def-existing",
      }),
    ];
    expect(enrichLogLineItemsWithMap(items, defMap)[0].benchmark_definition_id).toBe(
      "def-existing",
    );
  });

  it("does not bind complex sets with no PR-basis type", () => {
    const items = [
      line({
        line_item_kind: "complex_set",
        benchmark_type_id: null,
        prescribed_percentage: null,
      }),
    ];
    expect(enrichLogLineItemsWithMap(items, defMap)[0].benchmark_definition_id).toBeNull();
  });
});
