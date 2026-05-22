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

  it("ignores failed and pending lift attempts", () => {
    const best = pickBestPerformanceRow([
      {
        id: "failed-heavy",
        weight_lifted: 315,
        status: "failed",
        performance_date: "2026-03-01",
        created_at: null,
      },
      {
        id: "pending-heavy",
        weight_lifted: 305,
        status: "pending",
        performance_date: "2026-03-02",
        created_at: null,
      },
      {
        id: "completed",
        weight_lifted: 285,
        status: "completed",
        performance_date: "2026-02-01",
        created_at: null,
      },
    ]);
    expect(best?.id).toBe("completed");
  });

  it("keeps legacy null-status lifts eligible", () => {
    const best = pickBestPerformanceRow([
      {
        id: "legacy",
        weight_lifted: 245,
        status: null,
        performance_date: "2026-01-01",
        created_at: null,
      },
      {
        id: "completed",
        weight_lifted: 225,
        status: "completed",
        performance_date: "2026-02-01",
        created_at: null,
      },
    ]);
    expect(best?.id).toBe("legacy");
  });
});
