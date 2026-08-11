import { describe, expect, it } from "vitest";
import {
  rankLeaderboardEntries,
  sortKeyForScore,
  type LeaderboardPerfRow,
} from "./rank-entries";

function row(
  partial: Partial<LeaderboardPerfRow> & Pick<LeaderboardPerfRow, "id" | "score">,
): LeaderboardPerfRow {
  return {
    contact_id: "c1",
    programming_id: "p1",
    segment_group_id: null,
    result_value: null,
    workout_scale: "rx",
    ...partial,
  };
}

describe("sortKeyForScore time metrics", () => {
  it("ranks by result_value seconds ascending", () => {
    expect(sortKeyForScore(row({ id: "a", score: "10:00", result_value: 600 }), "time")).toBe(600);
    expect(sortKeyForScore(row({ id: "b", score: "9:30", result_value: 570 }), "time")).toBe(570);
  });

  it("parses mm:ss from score when result_value is null", () => {
    expect(sortKeyForScore(row({ id: "a", score: "16:48" }), "time")).toBe(16 * 60 + 48);
  });

  it("does not treat DNF / unparsed times as 0:00", () => {
    expect(sortKeyForScore(row({ id: "dnf", score: "DNF" }), "time")).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(sortKeyForScore(row({ id: "junk", score: "12+5" }), "time")).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(sortKeyForScore(row({ id: "empty", score: "" }), "time")).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("applies the same last-place key for sum_interval_times", () => {
    expect(sortKeyForScore(row({ id: "dnf", score: "DNF" }), "sum_interval_times")).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

describe("rankLeaderboardEntries", () => {
  it("places unparsed time scores after real finishes", () => {
    const ranked = rankLeaderboardEntries(
      [
        row({ id: "dnf", score: "DNF", result_value: null }),
        row({ id: "slow", score: "18:00", result_value: 1080 }),
        row({ id: "fast", score: "12:30", result_value: 750 }),
        row({ id: "junk", score: "almost", result_value: null }),
      ],
      "time",
      "for_time",
    );
    expect(ranked.map((r) => r.id)).toEqual(["fast", "slow", "dnf", "junk"]);
  });
});
