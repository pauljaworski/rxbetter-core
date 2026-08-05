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
        id: "miss",
        weight_lifted: 315,
        performance_date: "2026-04-01",
        created_at: null,
        status: "failed",
      },
      {
        id: "pending",
        weight_lifted: 305,
        performance_date: "2026-04-02",
        created_at: null,
        status: "pending",
      },
      {
        id: "made",
        weight_lifted: 285,
        performance_date: "2026-04-03",
        created_at: null,
        status: "completed",
      },
    ]);

    expect(best?.id).toBe("made");
  });

  it("keeps legacy rows without status eligible for PR recompute", () => {
    const best = pickBestPerformanceRow([
      {
        id: "legacy",
        weight_lifted: 245,
        performance_date: "2026-01-01",
        created_at: null,
        status: null,
      },
    ]);

    expect(best?.id).toBe("legacy");
  });
});
