import { beforeEach, describe, expect, it, vi } from "vitest";

const rangeMock = vi.fn();
const orderMock = vi.fn(() => ({ range: rangeMock }));
const eqMock = vi.fn(() => ({ order: orderMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock, insert: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("@/lib/pr/record-athlete-pr", () => ({
  recomputeBenchmarkSummary: vi.fn(async () => ({ error: null })),
}));

import {
  addExistingPerfKeys,
  commitAthleteImport,
  EXISTING_PERF_PAGE_SIZE,
  perfKey,
} from "./commit-athlete-import";
import type { PreparedImportRow } from "./prepare-import-rows";

function liftRow(overrides: Partial<PreparedImportRow> = {}): PreparedImportRow {
  return {
    rowIndex: 0,
    kind: "lift",
    date: "2024-01-01",
    movementLabel: "Back Squat",
    weightLb: 300,
    repCount: 1,
    score: null,
    workoutName: null,
    workoutScale: "rx",
    benchmarkTypeId: "bt-1",
    benchmarkDefinitionId: "def-1",
    skipReason: null,
    ...overrides,
  };
}

describe("perfKey / addExistingPerfKeys", () => {
  it("builds stable dedupe keys from ledger rows", () => {
    const keys = new Set<string>();
    addExistingPerfKeys(keys, [
      {
        performance_date: "2024-01-01T00:00:00",
        benchmark_definition_id: "def-1",
        weight_lifted: 300.4,
        score: null,
      },
      {
        performance_date: "2024-02-02",
        benchmark_definition_id: null,
        weight_lifted: null,
        score: " 5:18 ",
      },
    ]);
    expect(keys.has(perfKey("2024-01-01", "def-1", 300, null))).toBe(true);
    expect(keys.has(perfKey("2024-02-02", null, null, "5:18"))).toBe(true);
  });
});

describe("commitAthleteImport existing-history pagination", () => {
  beforeEach(() => {
    fromMock.mockClear();
    selectMock.mockClear();
    eqMock.mockClear();
    orderMock.mockClear();
    rangeMock.mockReset();
  });

  it("pages past PostgREST max_rows so late history still dedupes", async () => {
    const page1 = Array.from({ length: EXISTING_PERF_PAGE_SIZE }, (_, i) => ({
      id: `id-${String(i).padStart(4, "0")}`,
      performance_date: "2020-01-01",
      benchmark_definition_id: "def-old",
      weight_lifted: 100 + i,
      score: null,
    }));
    const page2 = [
      {
        id: "id-1000",
        performance_date: "2024-06-15",
        benchmark_definition_id: "def-1",
        weight_lifted: 315,
        score: null,
      },
    ];

    rangeMock
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockImplementation((table: string) => {
      if (table === "athlete_performance") {
        return { select: selectMock, insert: insertMock };
      }
      return { select: selectMock, insert: insertMock };
    });

    const result = await commitAthleteImport("contact-1", [
      liftRow({
        date: "2024-06-15",
        weightLb: 315,
        benchmarkDefinitionId: "def-1",
      }),
      liftRow({
        rowIndex: 1,
        date: "2024-07-01",
        weightLb: 320,
        benchmarkDefinitionId: "def-1",
      }),
    ]);

    expect(rangeMock).toHaveBeenCalledTimes(2);
    expect(rangeMock).toHaveBeenNthCalledWith(1, 0, EXISTING_PERF_PAGE_SIZE - 1);
    expect(rangeMock).toHaveBeenNthCalledWith(
      2,
      EXISTING_PERF_PAGE_SIZE,
      EXISTING_PERF_PAGE_SIZE * 2 - 1,
    );
    expect(result.duplicates).toBe(1);
    expect(result.inserted).toBe(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).toHaveLength(1);
    expect(insertMock.mock.calls[0][0][0].weight_lifted).toBe(320);
  });
});
