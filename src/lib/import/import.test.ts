import { readFileSync } from "node:fs";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { parseCsvText } from "./parse-spreadsheet";
import { detectColumnMapping, applyColumnMapping } from "./map-import-columns";
import { matchBenchmarkType } from "./match-benchmark";
import { parseImportDate, prepareImportRows, type PreparedImportRow } from "./prepare-import-rows";

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  existingRows: [] as Record<string, unknown>[],
  insertedChunks: [] as Record<string, unknown>[][],
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => supabaseMocks.from(...args),
  },
}));

vi.mock("@/lib/pr/record-athlete-pr", () => ({
  recomputeBenchmarkSummary: vi.fn(async () => ({ error: null })),
}));

import { commitAthleteImport } from "./commit-athlete-import";

function workoutImportRow(name: string, score: string): PreparedImportRow {
  return {
    rowIndex: 0,
    kind: "workout",
    date: "2024-06-01",
    movementLabel: name,
    weightLb: null,
    repCount: null,
    score,
    workoutName: name,
    workoutScale: "rx",
    benchmarkTypeId: null,
    benchmarkDefinitionId: null,
    skipReason: null,
  };
}

beforeEach(() => {
  supabaseMocks.from.mockReset();
  supabaseMocks.existingRows.length = 0;
  supabaseMocks.insertedChunks.length = 0;
  supabaseMocks.from.mockImplementation((table: string) => {
    expect(table).toBe("athlete_performance");
    return {
      select: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: supabaseMocks.existingRows, error: null })),
      })),
      insert: vi.fn(async (chunk: Record<string, unknown>[]) => {
        supabaseMocks.insertedChunks.push(chunk);
        return { error: null };
      }),
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
  it("keeps distinct same-day workout imports with matching scores", async () => {
    const result = await commitAthleteImport("contact-1", [
      workoutImportRow("Fran", "4:32"),
      workoutImportRow("Grace", "4:32"),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.duplicates).toBe(0);
    expect(result.inserted).toBe(2);
    expect(supabaseMocks.insertedChunks[0]).toHaveLength(2);
    expect(supabaseMocks.insertedChunks[0].map((row) => row.score_meta)).toEqual([
      { source: "import", label: "Fran", kind: "workout" },
      { source: "import", label: "Grace", kind: "workout" },
    ]);
  });

  it("still skips a repeated imported workout with the same label", async () => {
    supabaseMocks.existingRows.push({
      performance_date: "2024-06-01",
      benchmark_definition_id: null,
      weight_lifted: null,
      score: "4:32",
      score_meta: { source: "import", label: "Fran", kind: "workout" },
    });

    const result = await commitAthleteImport("contact-1", [
      workoutImportRow("Fran", "4:32"),
      workoutImportRow("Grace", "4:32"),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.duplicates).toBe(1);
    expect(result.inserted).toBe(1);
    expect(supabaseMocks.insertedChunks[0]).toHaveLength(1);
    expect(supabaseMocks.insertedChunks[0][0].score_meta).toEqual({
      source: "import",
      label: "Grace",
      kind: "workout",
    });
  });
});

describe("Triad SugarWOD programming import guardrails", () => {
  it("maps Clean Pull rows to the Clean Pull benchmark", () => {
    const sql = readFileSync("supabase/remote/05_triad_sugarwod_programming.sql", "utf8");
    expect(sql).toContain(
      "'e5000000-0000-4000-8000-202606030001', (select id from public.benchmark_type where name = 'Clean Pull')",
    );
    expect(sql).toContain("bt.name = 'Clean Pull' and bd.rep_count = 3");
  });

  it("checks specific lift names before broader prefixes in the generator", () => {
    const script = readFileSync("scripts/import-triad-sugarwod-programming.mjs", "utf8");
    expect(script).toContain("'Clean Pull'");
    expect(script).toContain("sort((a, b) => b.length - a.length)");
  });
});
