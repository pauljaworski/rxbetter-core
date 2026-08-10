import { describe, expect, it } from "vitest";
import { parseCsvText } from "./parse-spreadsheet";
import { detectColumnMapping, applyColumnMapping } from "./map-import-columns";
import { matchBenchmarkType } from "./match-benchmark";
import { parseImportDate, prepareImportRows } from "./prepare-import-rows";

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
    { id: "3", name: "Front Squat" },
    { id: "4", name: "Overhead Squat" },
    { id: "5", name: "Clean & Jerk" },
    { id: "6", name: "Power Clean" },
    { id: "7", name: "Push Jerk" },
    { id: "8", name: "Strict Press" },
    { id: "9", name: "Handstand Push-Up" },
    { id: "10", name: "Thruster" },
    { id: "11", name: "Kettlebell Swing" },
  ];

  it("matches exact and plural labels", () => {
    expect(matchBenchmarkType("back squat", catalog)?.id).toBe("1");
    expect(matchBenchmarkType("Deadlift", catalog)?.id).toBe("2");
    expect(matchBenchmarkType("Front Squats", catalog)?.name).toBe("Front Squat");
    expect(matchBenchmarkType("Thrusters", catalog)?.name).toBe("Thruster");
    expect(matchBenchmarkType("Clean and Jerk", catalog)?.name).toBe("Clean & Jerk");
  });

  it("resolves common abbreviations via aliases", () => {
    expect(matchBenchmarkType("KB Swing", catalog)?.name).toBe("Kettlebell Swing");
    expect(matchBenchmarkType("C&J", catalog)?.name).toBe("Clean & Jerk");
    expect(matchBenchmarkType("Strict HSPU", catalog)?.name).toBe("Handstand Push-Up");
  });

  it("does not bind accessory / compound labels to the wrong PR vault", () => {
    // Token/substring fuzzy used to map these onto squat/press/C&J definitions.
    expect(matchBenchmarkType("Front Rack Lunges", catalog)).toBeNull();
    expect(matchBenchmarkType("Back Rack Lunges", catalog)).toBeNull();
    expect(matchBenchmarkType("Overhead Lunge", catalog)).toBeNull();
    expect(matchBenchmarkType("Power Clean & Push Jerk", catalog)).toBeNull();
    expect(matchBenchmarkType("Walking Lunges", catalog)).toBeNull();
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
