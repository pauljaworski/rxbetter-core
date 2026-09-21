import { describe, expect, it } from "vitest";
import { buildSegmentPerformanceUpdate } from "./segment-performance-write";

describe("buildSegmentPerformanceUpdate", () => {
  const base = {
    score: "12:34",
    resultValue: 754,
    wodDate: "2026-07-30",
    workoutScale: "rx" as const,
  };

  it("omits score_meta when caller did not pass scoreMeta (preserve on update)", () => {
    const payload = buildSegmentPerformanceUpdate(base);
    expect(payload).not.toHaveProperty("score_meta");
    expect(payload).not.toHaveProperty("programming_id");
    expect(payload).not.toHaveProperty("programming_line_item_id");
    expect(payload).not.toHaveProperty("segment_group_id");
    expect(payload).not.toHaveProperty("contact_id");
  });

  it("writes score_meta when explicitly provided", () => {
    const meta = { version: 1, schemeKind: "rft" };
    expect(buildSegmentPerformanceUpdate({ ...base, scoreMeta: meta }).score_meta).toEqual(meta);
    expect(buildSegmentPerformanceUpdate({ ...base, scoreMeta: null }).score_meta).toEqual({});
  });
});
