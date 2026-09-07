import { describe, expect, it } from "vitest";
import {
  buildIntervalScoreMeta,
  deriveIntervalTotalTime,
  intervalRoundInputsFromMeta,
  parseIntervalScoreMeta,
} from "./interval-score";

describe("interval-score", () => {
  it("sums per-round times into total", () => {
    const result = deriveIntervalTotalTime(3, ["1:30", "1:45", "2:00"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.totalTimeSec).toBe(90 + 105 + 120);
    expect(result.result.roundTimesSec).toEqual([90, 105, 120]);
  });

  it("accepts plain seconds", () => {
    const result = deriveIntervalTotalTime(2, ["90", "100"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.totalTimeSec).toBe(190);
  });

  it("requires every round", () => {
    const result = deriveIntervalTotalTime(3, ["1:00", "", "1:00"]);
    expect(result.ok).toBe(false);
  });

  it("round-trips meta", () => {
    const derived = { totalTimeSec: 300, roundTimesSec: [100, 100, 100] };
    const meta = buildIntervalScoreMeta(3, 240, derived);
    expect(parseIntervalScoreMeta(meta)?.derived.totalTimeSec).toBe(300);
    expect(intervalRoundInputsFromMeta(meta, 3)).toEqual(["1:40", "1:40", "1:40"]);
  });
});
