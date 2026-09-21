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

  it("keeps hyphenated rep ladders on the weekday instead of inventing a date", () => {
    const raw = `Monday
For time:
21-15-9
Thrusters
Pull-ups

12-9
Thrusters
Chest-to-bar

Tuesday
Back Squat 5x3`;
    const days = splitWeekPaste(raw, weekStart);
    expect(days.map((d) => d.dateKey)).toEqual(["2026-09-14", "2026-09-15"]);
    expect(days[0].rawText).toContain("21-15-9");
    expect(days[0].rawText).toContain("12-9");
    expect(days[0].rawText).toContain("Chest-to-bar");
    expect(days[1].rawText).toContain("Back Squat");
  });

  it("still splits slash and ISO date headers", () => {
    const raw = `9/15
AMRAP 12
10 thrusters

2026-09-16
Deadlift 3x5

9-17-2026
Press 5x5`;
    const days = splitWeekPaste(raw, weekStart);
    expect(days.map((d) => d.dateKey)).toEqual(["2026-09-15", "2026-09-16", "2026-09-17"]);
    expect(days[0].rawText).toContain("thrusters");
    expect(days[1].rawText).toContain("Deadlift");
    expect(days[2].rawText).toContain("Press");
  });

  it("does not treat overflowed hyphen pairs like 21-15 as September next year", () => {
    const raw = `Monday
For time:
21-15
Thrusters
Pull-ups`;
    const days = splitWeekPaste(raw, weekStart);
    expect(days).toHaveLength(1);
    expect(days[0].dateKey).toBe("2026-09-14");
    expect(days[0].rawText).toContain("21-15");
    expect(days[0].rawText).toContain("Thrusters");
  });
});
