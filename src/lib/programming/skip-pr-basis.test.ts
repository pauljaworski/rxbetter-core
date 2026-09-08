import { describe, expect, it } from "vitest";
import { skipPrBasisFromPersisted } from "./skip-pr-basis";

describe("skipPrBasisFromPersisted", () => {
  it("restores skip for strength sets saved without % or PR definition", () => {
    expect(
      skipPrBasisFromPersisted({
        line_item_kind: "strength_set",
        benchmark_type_id: "type-1",
        benchmark_definition_id: null,
        prescribed_percentage: null,
      }),
    ).toBe(true);
  });

  it("does not skip strength sets that still have a % of PR", () => {
    expect(
      skipPrBasisFromPersisted({
        line_item_kind: "strength_set",
        benchmark_type_id: "type-1",
        benchmark_definition_id: null,
        prescribed_percentage: 0.75,
      }),
    ).toBe(false);
  });

  it("does not skip strength sets bound to a rep-max definition", () => {
    expect(
      skipPrBasisFromPersisted({
        line_item_kind: "strength_set",
        benchmark_type_id: "type-1",
        benchmark_definition_id: "def-1",
        prescribed_percentage: null,
      }),
    ).toBe(false);
  });

  it("restores skip for complex sets with no PR-basis type", () => {
    expect(
      skipPrBasisFromPersisted({
        line_item_kind: "complex_set",
        benchmark_type_id: null,
        benchmark_definition_id: null,
        prescribed_percentage: null,
      }),
    ).toBe(true);
  });

  it("keeps complex sets with a PR basis", () => {
    expect(
      skipPrBasisFromPersisted({
        line_item_kind: "complex_set",
        benchmark_type_id: "type-1",
        benchmark_definition_id: "def-1",
        prescribed_percentage: 0.8,
      }),
    ).toBe(false);
  });
});
