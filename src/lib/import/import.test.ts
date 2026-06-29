import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseCsvText } from "./parse-spreadsheet";
import { detectColumnMapping, applyColumnMapping } from "./map-import-columns";
import { matchBenchmarkType } from "./match-benchmark";
import { parseImportDate, prepareImportRows } from "./prepare-import-rows";
import { commitAthleteImport } from "./commit-athlete-import";
import type { PreparedImportRow } from "./prepare-import-rows";

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: supabaseMocks.from,
  },
}));

vi.mock("@/lib/pr/record-athlete-pr", () => ({
  recomputeBenchmarkSummary: vi.fn(),
}));

beforeEach(() => {
  supabaseMocks.insert.mockReset();
  supabaseMocks.from.mockReset();
  supabaseMocks.insert.mockResolvedValue({ error: null });
  supabaseMocks.from.mockImplementation((table: string) => {
    if (table !== "athlete_performance") throw new Error(`Unexpected table ${table}`);
    return {
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
      insert: supabaseMocks.insert,
    };
  });
});

describe("parseCsvText", () => {
  it("parses quoted CSV with header", () => {
    const table = parseCsvText('date,movement,weight\n2024-01-15,"Back Squat",315');
    expect(table?.headers).toEqual(["date", "movement", "weight"]);
    expect(table?.rows[0]).toEqual(["2024-01-15", "Back Squat", "315"]);
  });
});

describe("detectColumnMapping", () => {
  it("maps common lift export headers", () => {
    const mapping = detectColumnMapping(["Date", "Benchmark Name", "Max Weight", "Reps"]);
    expect(mapping[0]).toBe("date");
    expect(mapping).toContain("movement");
    expect(mapping).toContain("weight");
  });
});

describe("parseImportDate", () => {
  it("parses ISO and US dates", () => {
    expect(parseImportDate("2024-03-01")).toBe("2024-03-01");
    expect(parseImportDate("3/1/2024")).toBe("2024-03-01");
  });
});

describe("matchBenchmarkType", () => {
  const catalog = [
    { id: "1", name: "Back Squat" },
    { id: "2", name: "Deadlift" },
  ];

  it("exact and fuzzy match", () => {
    expect(matchBenchmarkType("back squat", catalog)?.id).toBe("1");
    expect(matchBenchmarkType("Deadlift", catalog)?.id).toBe("2");
  });
});

describe("prepareImportRows", () => {
  it("classifies lift rows", () => {
    const mapped = applyColumnMapping(
      {
        headers: ["date", "movement", "weight", "reps"],
        rows: [["2024-01-01", "Back Squat", "300", "1"]],
      },
      ["date", "movement", "weight", "reps"],
    );
    const rows = prepareImportRows(mapped, [{ id: "bs", name: "Back Squat" }], [
      { id: "def1", benchmark_type_id: "bs", rep_count: 1 },
    ]);
    expect(rows[0].kind).toBe("lift");
    expect(rows[0].benchmarkDefinitionId).toBe("def1");
  });
});

describe("commitAthleteImport", () => {
  it("imports distinct same-day workouts with the same score", async () => {
    const base: PreparedImportRow = {
      rowIndex: 0,
      kind: "workout",
      date: "2026-06-29",
      movementLabel: null,
      weightLb: null,
      repCount: null,
      score: "4:32",
      workoutName: "Fran",
      workoutScale: "rx",
      benchmarkTypeId: null,
      benchmarkDefinitionId: null,
      skipReason: null,
    };

    const result = await commitAthleteImport("contact-1", [
      base,
      { ...base, rowIndex: 1, workoutName: "Grace" },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.duplicates).toBe(0);
    expect(result.inserted).toBe(2);
    expect(supabaseMocks.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ score_meta: expect.objectContaining({ label: "Fran" }) }),
        expect.objectContaining({ score_meta: expect.objectContaining({ label: "Grace" }) }),
      ]),
    );
  });
});
