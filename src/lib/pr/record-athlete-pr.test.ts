import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  pickBestPerformanceRow,
  recomputeBenchmarkSummary,
  recordAthletePr,
} from "./record-athlete-pr";

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

describe("recomputeBenchmarkSummary", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockFrom.mockReset();
  });

  it("calls atomic recompute RPC (no multi-step client writes)", async () => {
    mockRpc.mockResolvedValue({ error: null });

    const result = await recomputeBenchmarkSummary("contact-1", "def-1");

    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("recompute_athlete_benchmark_summary", {
      p_contact_id: "contact-1",
      p_benchmark_definition_id: "def-1",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("surfaces RPC authorization / DB errors", async () => {
    mockRpc.mockResolvedValue({
      error: { message: "Not allowed to recompute PR vault for this athlete" },
    });

    const result = await recomputeBenchmarkSummary("contact-1", "def-1");
    expect(result.error).toMatch(/not allowed|recompute|pr vault/i);
  });
});

describe("recordAthletePr", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockFrom.mockReset();
  });

  it("inserts the attempt then recomputes via RPC", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });
    mockRpc.mockResolvedValue({ error: null });

    const result = await recordAthletePr({
      contactId: "contact-1",
      benchmarkDefinitionId: "def-1",
      benchmarkTypeId: "type-1",
      weightLb: 315,
      performanceDate: "2026-08-07",
    });

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith("athlete_performance");
    expect(insert).toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith("recompute_athlete_benchmark_summary", {
      p_contact_id: "contact-1",
      p_benchmark_definition_id: "def-1",
    });
  });
});
