import { describe, expect, it } from "vitest";
import { parseCsvText } from "./parse-spreadsheet";
import { detectColumnMapping, applyColumnMapping } from "./map-import-columns";
import { matchBenchmarkType } from "./match-benchmark";
import {
  parseImportDate,
  parseImportRepCount,
  parseImportWeightLb,
  prepareImportRows,
} from "./prepare-import-rows";

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

describe("parseImportWeightLb", () => {
  it("accepts single loads with unit/comma noise", () => {
    expect(parseImportWeightLb("315")).toEqual({ weight: 315, error: null });
    expect(parseImportWeightLb("315 lb")).toEqual({ weight: 315, error: null });
    expect(parseImportWeightLb("1,225")).toEqual({ weight: 1225, error: null });
  });

  it("rejects dual M/F loads instead of concatenating digits", () => {
    expect(parseImportWeightLb("135/95").error).toMatch(/dual load/i);
    expect(parseImportWeightLb("135/95").weight).toBeNull();
    expect(parseImportWeightLb("20/14 lb").error).toMatch(/dual load/i);
    expect(parseImportWeightLb("185-125").error).toMatch(/dual load/i);
  });
});

describe("parseImportRepCount", () => {
  it("uses reps from sets×reps notation", () => {
    expect(parseImportRepCount("5x3")).toBe(3);
    expect(parseImportRepCount("5×3")).toBe(3);
    expect(parseImportRepCount("3x5")).toBe(5);
  });

  it("parses plain RM values", () => {
    expect(parseImportRepCount("1")).toBe(1);
    expect(parseImportRepCount("5RM")).toBe(5);
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

  it("skips dual-load weights and maps sets×reps to the correct RM", () => {
    const mapped = applyColumnMapping(
      {
        headers: ["date", "movement", "weight", "reps"],
        rows: [
          ["2024-01-01", "Back Squat", "135/95", "1"],
          ["2024-01-02", "Back Squat", "315", "5x3"],
        ],
      },
      ["date", "movement", "weight", "reps"],
    );
    const rows = prepareImportRows(
      mapped,
      [{ id: "bs", name: "Back Squat" }],
      [
        { id: "def1", benchmark_type_id: "bs", rep_count: 1 },
        { id: "def3", benchmark_type_id: "bs", rep_count: 3 },
        { id: "def5", benchmark_type_id: "bs", rep_count: 5 },
      ],
    );
    expect(rows[0].kind).toBe("skip");
    expect(rows[0].skipReason).toMatch(/dual load/i);
    expect(rows[1].kind).toBe("lift");
    expect(rows[1].weightLb).toBe(315);
    expect(rows[1].repCount).toBe(3);
    expect(rows[1].benchmarkDefinitionId).toBe("def3");
  });
});
