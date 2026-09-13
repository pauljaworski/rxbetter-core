import { describe, expect, it } from "vitest";
import { buildSegmentPerformanceWritePayload } from "./segment-performance-payload";

const rftMeta = {
  version: 1 as const,
  schemeKind: "rft" as const,
  rounds: 5,
  restBetweenRoundsSec: 60,
  restTotalSec: 240,
  roundWorkingTimesSec: [225, 218, 215, 212, 210],
  entryMode: "splits" as const,
  derived: { workingTimeSec: 1080 },
};

describe("buildSegmentPerformanceWritePayload", () => {
  it("does not include score_meta on update when the caller omitted it", () => {
    const payload = buildSegmentPerformanceWritePayload(
      {
        score: "18:00",
        resultValue: 1080,
        wodDate: "2026-09-13",
        workoutScale: "rx",
      },
      "update",
    );
    expect(payload).not.toHaveProperty("score_meta");
    expect(payload.score).toBe("18:00");
  });

  it("writes score_meta on update when the caller provided splits", () => {
    const payload = buildSegmentPerformanceWritePayload(
      {
        score: "18:00",
        resultValue: 1080,
        scoreMeta: rftMeta,
        wodDate: "2026-09-13",
        workoutScale: "rx",
      },
      "update",
    );
    expect(payload.score_meta).toEqual(rftMeta);
  });

  it("defaults score_meta to {} on insert when omitted", () => {
    const payload = buildSegmentPerformanceWritePayload(
      {
        score: "3:12",
        resultValue: 192,
        wodDate: "2026-09-13",
        workoutScale: "rx",
      },
      "insert",
    );
    expect(payload.score_meta).toEqual({});
  });
});
