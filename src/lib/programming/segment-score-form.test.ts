import { describe, expect, it } from "vitest";
import { resolveSegmentScoreFormKind, resolveSegmentScoreFormKindFromRaw } from "./segment-score-form";

describe("resolveSegmentScoreFormKind", () => {
  it("uses RFT splits when rest between rounds is programmed", () => {
    expect(
      resolveSegmentScoreFormKind({
        kind: "rft",
        rounds: 5,
        restBetweenRoundsSec: 60,
        scoreMetric: "time",
      }),
    ).toBe("rft_splits");
  });

  it("uses the simple time field for RFT without rest", () => {
    expect(
      resolveSegmentScoreFormKind({
        kind: "rft",
        rounds: 5,
        restBetweenRoundsSec: 0,
        scoreMetric: "time",
      }),
    ).toBe("simple");
  });

  it("uses interval rounds for interval series", () => {
    expect(
      resolveSegmentScoreFormKind({
        kind: "interval_series",
        intervalSec: 180,
        rounds: 4,
        scoreMetric: "sum_interval_times",
      }),
    ).toBe("interval");
  });

  it("uses the simple field for AMRAP / for-time", () => {
    expect(
      resolveSegmentScoreFormKind({
        kind: "amrap",
        timeCapMin: 12,
        scoreMetric: "rounds_reps",
      }),
    ).toBe("simple");
    expect(
      resolveSegmentScoreFormKind({
        kind: "for_time",
        scoreMetric: "time",
      }),
    ).toBe("simple");
  });

  it("parses raw workout_scheme the same way the UI does", () => {
    expect(
      resolveSegmentScoreFormKindFromRaw({
        kind: "rft",
        rounds: 3,
        restBetweenRoundsSec: 90,
        scoreMetric: "time",
      }),
    ).toBe("rft_splits");
    expect(resolveSegmentScoreFormKindFromRaw(null)).toBe("simple");
  });
});
