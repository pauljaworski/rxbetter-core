import { describe, expect, it } from "vitest";
import {
  formatComplexMovementTitle,
  parseMovementComponents,
} from "./movement-components-schema";

describe("movement-components", () => {
  it("formats complex title", () => {
    expect(
      formatComplexMovementTitle([
        { benchmark_type_id: null, reps: 2, label: "Clean Pull" },
        { benchmark_type_id: "uuid", reps: 1, label: "Power Clean" },
      ]),
    ).toBe("2 Clean Pull + 1 Power Clean");
  });

  it("parses valid array", () => {
    const r = parseMovementComponents([
      { benchmark_type_id: null, reps: 3, label: "Squat" },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].reps).toBe(3);
  });
});
