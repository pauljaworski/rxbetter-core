import { beforeEach, describe, expect, it, vi } from "vitest";
import { POSTGREST_PAGE_SIZE } from "@/lib/supabase/page-all-rows";

const rangeMock = vi.fn();
const orderMock = vi.fn(() => ({ range: rangeMock }));
const notMock = vi.fn(() => ({ order: orderMock }));
const eq2Mock = vi.fn(() => ({ not: notMock }));
const eq1Mock = vi.fn(() => ({ eq: eq2Mock }));
const selectMock = vi.fn(() => ({ eq: eq1Mock }));
const updateChain = {
  eq: vi.fn(function eq() {
    return updateChain;
  }),
  then: undefined as unknown,
};
// Make the chain thenable so `await update(...).eq(...).eq(...)` resolves.
(updateChain as { then: unknown }).then = (
  resolve: (value: { error: null }) => unknown,
) => resolve({ error: null });

const updateMock = vi.fn(() => updateChain);
const deleteChain = {
  eq: vi.fn(function eq() {
    return deleteChain;
  }),
  then: undefined as unknown,
};
(deleteChain as { then: unknown }).then = (
  resolve: (value: { error: null }) => unknown,
) => resolve({ error: null });
const deleteMock = vi.fn(() => deleteChain);
const maybeSingleMock = vi.fn();
const sumEq2Mock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const sumEq1Mock = vi.fn(() => ({ eq: sumEq2Mock }));
const sumSelectMock = vi.fn(() => ({ eq: sumEq1Mock }));
const insertMock = vi.fn(async () => ({ error: null }));
const sumUpdateEqMock = vi.fn(async () => ({ error: null }));
const sumUpdateMock = vi.fn(() => ({ eq: sumUpdateEqMock }));

const fromMock = vi.fn((table: string) => {
  if (table === "athlete_benchmark_summary") {
    return {
      select: sumSelectMock,
      insert: insertMock,
      update: sumUpdateMock,
      delete: deleteMock,
    };
  }
  return {
    select: selectMock,
    update: updateMock,
    delete: deleteMock,
    insert: insertMock,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import {
  pickBestPerformanceRow,
  recomputeBenchmarkSummary,
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

describe("recomputeBenchmarkSummary pagination", () => {
  beforeEach(() => {
    fromMock.mockClear();
    selectMock.mockClear();
    eq1Mock.mockClear();
    eq2Mock.mockClear();
    notMock.mockClear();
    orderMock.mockClear();
    rangeMock.mockReset();
    updateMock.mockClear();
    updateChain.eq.mockClear();
    insertMock.mockClear();
    sumSelectMock.mockClear();
    sumUpdateMock.mockClear();
    maybeSingleMock.mockReset();
  });

  it("pages past max_rows so a heavier PR on page 2 wins the vault", async () => {
    const page1 = Array.from({ length: POSTGREST_PAGE_SIZE }, (_, i) => ({
      id: `old-${String(i).padStart(4, "0")}`,
      weight_lifted: 200 + (i % 50),
      performance_date: "2020-01-01",
      created_at: null,
    }));
    const page2 = [
      {
        id: "new-pr",
        weight_lifted: 405,
        performance_date: "2026-08-01",
        created_at: null,
      },
    ];

    rangeMock
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null });
    maybeSingleMock.mockResolvedValue({ data: { id: "sum-1" }, error: null });
    sumUpdateEqMock.mockResolvedValue({ error: null });

    const { error } = await recomputeBenchmarkSummary("contact-1", "def-1");
    expect(error).toBeNull();
    expect(rangeMock).toHaveBeenCalledTimes(2);
    expect(sumUpdateMock).toHaveBeenCalledWith({
      current_pr_weight: 405,
      date_pr_achieved: "2026-08-01",
    });
    // Final is_pr:true write targets the page-2 PR id
    expect(updateChain.eq).toHaveBeenCalledWith("id", "new-pr");
  });
});
