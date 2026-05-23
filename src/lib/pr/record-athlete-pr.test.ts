import { describe, expect, it } from "vitest";
import { pickBestPerformanceRow } from "./record-athlete-pr";

describe("pickBestPerformanceRow", () => {
  it("picks heaviest weight", () => {
    const best = pickBestPerformanceRow([
      {
        id: "a",
        weight_lifted: 200,
        performance_date: "2026-01-01",
        created_at: null,
        status: "completed",
      },
      {
        id: "b",
        weight_lifted: 225,
        performance_date: "2026-02-01",
        created_at: null,
        status: "completed",
      },
    ]);
    expect(best?.id).toBe("b");
  });

  it("breaks ties by latest date", () => {
    const best = pickBestPerformanceRow([
      {
        id: "a",
        weight_lifted: 225,
        performance_date: "2026-01-01",
        created_at: null,
        status: "completed",
      },
      {
        id: "b",
        weight_lifted: 225,
        performance_date: "2026-03-01",
        created_at: null,
        status: "completed",
      },
    ]);
    expect(best?.id).toBe("b");
  });

  it("ignores failed lifts when recomputing the PR row", () => {
    const best = pickBestPerformanceRow([
      {
        id: "miss",
        weight_lifted: 315,
        performance_date: "2026-02-01",
        created_at: null,
        status: "failed",
      },
      {
        id: "make",
        weight_lifted: 295,
        performance_date: "2026-02-02",
        created_at: null,
        status: "completed",
      },
    ]);
    expect(best?.id).toBe("make");
  });
});
