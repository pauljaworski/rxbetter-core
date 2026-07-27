import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATHLETE_LOG_LINE_ITEM_SELECT } from "./athlete-log-line-item-select";

describe("ATHLETE_LOG_LINE_ITEM_SELECT", () => {
  it("includes gender Rx, prescription units, and complex fields", () => {
    for (const field of [
      "prescription_unit",
      "rx_variants",
      "line_item_kind",
      "movement_components",
    ]) {
      expect(ATHLETE_LOG_LINE_ITEM_SELECT).toContain(field);
    }
  });

  it("is used by both Today and Calendar week loaders", () => {
    const root = resolve(import.meta.dirname, "../..");
    const today = readFileSync(resolve(root, "hooks/useWorkoutDay.ts"), "utf8");
    const calendar = readFileSync(resolve(root, "hooks/useProgrammingWeek.ts"), "utf8");
    expect(today).toContain("ATHLETE_LOG_LINE_ITEM_SELECT");
    expect(calendar).toContain("ATHLETE_LOG_LINE_ITEM_SELECT");
  });
});
