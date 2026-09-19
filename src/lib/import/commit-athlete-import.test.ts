import { beforeEach, describe, expect, it, vi } from "vitest";
import { commitAthleteImport } from "./commit-athlete-import";
import type { PreparedImportRow } from "./prepare-import-rows";

const mocks = vi.hoisted(() => {
  const rangeMock = vi.fn();
  const insertMock = vi.fn();
  const eqMock = vi.fn(() => ({ range: rangeMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }));
  return { eqMock, fromMock, insertMock, rangeMock, selectMock };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mocks.fromMock,
  },
}));

vi.mock("@/lib/pr/record-athlete-pr", () => ({
  recomputeBenchmarkSummary: vi.fn(async () => ({ error: null })),
}));

function workoutRow(overrides: Partial<PreparedImportRow>): PreparedImportRow {
  return {
    rowIndex: 0,
    kind: "workout",
    date: "2026-06-01",
    movementLabel: "Fran",
    weightLb: null,
    repCount: null,
    score: "4:32",
    workoutName: "Fran",
    workoutScale: "rx",
    benchmarkTypeId: null,
    benchmarkDefinitionId: null,
    skipReason: null,
    ...overrides,
  };
}

describe("commitAthleteImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rangeMock.mockResolvedValue({ data: [], error: null });
    mocks.insertMock.mockResolvedValue({ error: null });
  });

  it("imports same-day workouts with the same score when names differ", async () => {
    const result = await commitAthleteImport("contact-1", [
      workoutRow({ workoutName: "Fran", movementLabel: "Fran" }),
      workoutRow({ rowIndex: 1, workoutName: "Helen", movementLabel: "Helen" }),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.inserted).toBe(2);
    expect(result.duplicates).toBe(0);
    expect(mocks.insertMock).toHaveBeenCalledTimes(1);
    expect(mocks.insertMock.mock.calls[0][0]).toHaveLength(2);
  });

  it("pages existing history before deciding a row is new", async () => {
    mocks.rangeMock
      .mockResolvedValueOnce({
        data: Array.from({ length: 1000 }, (_, idx) => ({
          performance_date: "2026-05-01",
          benchmark_definition_id: null,
          weight_lifted: null,
          score: String(idx),
          score_meta: { label: `Workout ${idx}` },
        })),
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            performance_date: "2026-06-01",
            benchmark_definition_id: null,
            weight_lifted: null,
            score: "4:32",
            score_meta: { label: "Fran" },
          },
        ],
        error: null,
      });

    const result = await commitAthleteImport("contact-1", [workoutRow({})]);

    expect(result.inserted).toBe(0);
    expect(result.duplicates).toBe(1);
    expect(mocks.insertMock).not.toHaveBeenCalled();
    expect(mocks.rangeMock).toHaveBeenNthCalledWith(1, 0, 999);
    expect(mocks.rangeMock).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});
