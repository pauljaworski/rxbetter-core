import { describe, expect, it } from "vitest";
import { pickBestPerformanceRow } from "./record-athlete-pr";

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
