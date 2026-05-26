import { describe, expect, it } from "vitest";
import { formatComplexMovementTitle } from "./movement-components-schema";

describe("complex set prescription", () => {
  it("formats component reps independently", () => {
    const title = formatComplexMovementTitle([
      { reps: 1, label: "Snatch Pull", benchmark_type_id: null },
      { reps: 2, label: "Power Snatch", benchmark_type_id: null },
    ]);
    expect(title).toBe("1 Snatch Pull + 2 Power Snatch");
  });
});
