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

  it("ignores failed attempts when selecting PR weight", () => {
    const best = pickBestPerformanceRow([
      {
        id: "failed-heavy",
        weight_lifted: 300,
        performance_date: "2026-03-01",
        created_at: null,
        status: "failed",
      },
      {
        id: "completed",
        weight_lifted: 250,
        performance_date: "2026-02-01",
        created_at: null,
        status: "completed",
      },
    ]);
    expect(best?.id).toBe("completed");
  });

  it("keeps legacy rows without a status eligible", () => {
    const best = pickBestPerformanceRow([
      {
        id: "legacy",
        weight_lifted: 275,
        performance_date: "2026-01-01",
        created_at: null,
        status: null,
      },
      {
        id: "completed",
        weight_lifted: 250,
        performance_date: "2026-02-01",
        created_at: null,
        status: "completed",
      },
    ]);
    expect(best?.id).toBe("legacy");
  });
});
