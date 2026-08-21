import { describe, expect, it } from "vitest";
import {
  parseRoundsRepsScore,
  parseTotalRepsScore,
  rankLeaderboardEntries,
  type LeaderboardPerfRow,
} from "./rank-entries";

function row(id: string, score: string, result_value: number | null = null): LeaderboardPerfRow {
  return {
    id,
    contact_id: id,
    programming_id: "wod",
    segment_group_id: null,
    score,
    result_value,
    workout_scale: "rx",
  };
}

describe("parseRoundsRepsScore", () => {
  it("encodes leftover reps so even rounds beat incomplete previous rounds", () => {
    expect(parseRoundsRepsScore("12")).toBe(12000);
    expect(parseRoundsRepsScore("12 rounds")).toBe(12000);
    expect(parseRoundsRepsScore("12 round")).toBe(12000);
    expect(parseRoundsRepsScore("11+15")).toBe(11015);
    expect(parseRoundsRepsScore("11 + 15")).toBe(11015);
    expect(parseRoundsRepsScore("11 rounds + 15")).toBe(11015);
    expect(parseRoundsRepsScore("12")).toBeGreaterThan(parseRoundsRepsScore("11+15"));
  });

  it("treats 12+0 the same as 12 even rounds", () => {
    expect(parseRoundsRepsScore("12+0")).toBe(parseRoundsRepsScore("12"));
  });
});

describe("parseTotalRepsScore", () => {
  it("reads a raw rep count, including a reps suffix", () => {
    expect(parseTotalRepsScore("287")).toBe(287);
    expect(parseTotalRepsScore("287 reps")).toBe(287);
  });
});

describe("rankLeaderboardEntries", () => {
  it("ranks even AMRAP rounds ahead of fewer rounds plus leftover reps", () => {
    const ranked = rankLeaderboardEntries(
      [row("b", "11+20"), row("a", "12"), row("c", "12 rounds"), row("d", "10+99")],
      "rounds_reps",
      "amrap",
    );
    expect(ranked.map((r) => r.id).slice(0, 2).sort()).toEqual(["a", "c"]);
    expect(ranked.map((r) => r.id).slice(2)).toEqual(["b", "d"]);
  });

  it("ranks total-rep scores by raw count", () => {
    const ranked = rankLeaderboardEntries(
      [row("low", "200"), row("high", "287 reps"), row("mid", "250")],
      "reps",
    );
    expect(ranked.map((r) => r.id)).toEqual(["high", "mid", "low"]);
  });
});
