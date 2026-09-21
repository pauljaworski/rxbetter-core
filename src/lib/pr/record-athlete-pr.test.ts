import { describe, expect, it } from "vitest";
import { isEligibleForBenchmarkPr, pickBestPerformanceRow } from "./record-athlete-pr";

describe("pickBestPerformanceRow", () => {
  it("picks heaviest weight", () => {
    const best = pickBestPerformanceRow([
      { id: "a", weight_lifted: 200, performance_date: "2026-01-01", created_at: null },
      { id: "b", weight_lifted: 225, performance_date: "2026-02-01", created_at: null },
    ]);
    expect(best?.id).toBe("b");
  });

  it("breaks ties by latest date", () => {
    const best = pickBestPerformanceRow([
      { id: "a", weight_lifted: 225, performance_date: "2026-01-01", created_at: null },
      { id: "b", weight_lifted: 225, performance_date: "2026-03-01", created_at: null },
    ]);
    expect(best?.id).toBe("b");
  });
});

describe("isEligibleForBenchmarkPr", () => {
  it("always allows standalone vault/import rows (no programming line item)", () => {
    expect(
      isEligibleForBenchmarkPr(
        { programming_line_item_id: null, reps_prescribed: 5 },
        1,
      ),
    ).toBe(true);
  });

  it("allows class sets whose reps match the benchmark definition rep max", () => {
    expect(
      isEligibleForBenchmarkPr(
        { programming_line_item_id: "pli-1", reps_prescribed: 1 },
        1,
      ),
    ).toBe(true);
    expect(
      isEligibleForBenchmarkPr(
        { programming_line_item_id: "pli-1", reps_prescribed: 5 },
        5,
      ),
    ).toBe(true);
  });

  it("rejects multi-rep working sets logged against a 1RM definition", () => {
    expect(
      isEligibleForBenchmarkPr(
        { programming_line_item_id: "pli-1", reps_prescribed: 5 },
        1,
      ),
    ).toBe(false);
  });

  it("rejects class sets with unknown reps against a known definition", () => {
    expect(
      isEligibleForBenchmarkPr(
        { programming_line_item_id: "pli-1", reps_prescribed: null },
        1,
      ),
    ).toBe(false);
  });
});
