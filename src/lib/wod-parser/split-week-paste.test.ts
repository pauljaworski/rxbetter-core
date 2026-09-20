import { describe, expect, it } from "vitest";
import { startOfWeek } from "date-fns";
import {
  splitDayIntoSegments,
  splitWeekPaste,
  splitWeekPasteIntoSegments,
} from "@/lib/wod-parser/split-week-paste";

describe("splitWeekPaste", () => {
  const weekStart = startOfWeek(new Date("2026-09-14T12:00:00"), { weekStartsOn: 1 });

  it("splits weekday headers into day blocks", () => {
    const raw = `Monday
Back Squat 5x3

Tuesday
Deadlift 3x5`;
    const days = splitWeekPaste(raw, weekStart);
    expect(days.length).toBe(2);
    expect(days[0].rawText).toContain("Back Squat");
    expect(days[1].rawText).toContain("Deadlift");
  });

  it("splits segments within a day", () => {
    const segs = splitDayIntoSegments(`Strength
Back Squat 5x3

Metcon
AMRAP 12
10 thrusters`);
    expect(segs.length).toBeGreaterThanOrEqual(2);
  });

  it("produces segment blocks for the week", () => {
    const raw = `Mon
Strength
Squat 5x3
---
Metcon
AMRAP 10
Tue
Press 5x5`;
    const segs = splitWeekPasteIntoSegments(raw, weekStart);
    expect(segs.length).toBeGreaterThanOrEqual(3);
  });
});
