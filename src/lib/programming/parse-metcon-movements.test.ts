import { describe, expect, it } from "vitest";
import { parseMetconMovements } from "./parse-metcon-movements";

const catalog = [
  { id: "bt-wb", name: "Wall Ball", stimulus: "strength", sub_stimulus: "squat", purpose_variation: null },
  { id: "bt-c2b", name: "Chest-to-Bar", stimulus: "skill", sub_stimulus: "pull", purpose_variation: "gymnastics" },
  { id: "bt-run", name: "Run", stimulus: "skill", sub_stimulus: "mono", purpose_variation: "aerobic" },
  { id: "bt-t2b", name: "Toes to Bar", stimulus: "skill", sub_stimulus: "pull", purpose_variation: "gymnastics" },
];

describe("parseMetconMovements", () => {
  it("parses 3 RFT with movement list", () => {
    const r = parseMetconMovements("3 RFT: 400m run, 20 Wall Balls, 15 T2B", catalog);
    expect(r.metconFormat).toBe("for_time");
    expect(r.scheme?.kind).toBe("rft");
    if (r.scheme?.kind === "rft") expect(r.scheme.rounds).toBe(3);
    expect(r.movements.length).toBeGreaterThanOrEqual(2);
    const run = r.movements.find((m) => m.bench_name === "Run");
    expect(run?.prescription_unit).toBe("meters");
    expect(run?.reps_prescribed).toBe(400);
  });

  it("parses AMRAP header", () => {
    const r = parseMetconMovements("AMRAP 12\n10 Thrusters\n15 Pull-ups", catalog);
    expect(r.metconFormat).toBe("amrap");
    expect(r.scheme?.kind).toBe("amrap");
  });

  it("parses rep ladder with between-rounds run", () => {
    const text =
      "21-18-15-12-9: Wall Balls (30/20), Chest-to-Bar, After each round: 200m run";
    const r = parseMetconMovements(text, catalog);
    expect(r.scheme?.kind).toBe("rep_ladder");
    if (r.scheme?.kind === "rep_ladder") {
      expect(r.scheme.repSequence).toEqual([21, 18, 15, 12, 9]);
      expect(r.scheme.betweenRounds?.amount).toBe(200);
      expect(r.scheme.betweenRounds?.prescriptionUnit).toBe("meters");
    }
    expect(r.metconFormat).toBe("for_time");
    const wb = r.movements.find((m) => m.bench_name === "Wall Ball");
    expect(wb?.prescribed_score).toContain("30/20");
    const c2b = r.movements.find((m) => m.bench_name === "Chest-to-Bar");
    expect(c2b).toBeDefined();
    const run = r.movements.find((m) => m.bench_name === "Run");
    expect(run?.reps_prescribed).toBe(200);
    expect(run?.prescription_unit).toBe("meters");
  });
});
