import { describe, expect, it } from "vitest";
import {
  formatRestDuration,
  parseRestDuration,
  stimulusForNewMovement,
} from "./gym-benchmark-type";

describe("gym-benchmark-type helpers", () => {
  it("maps segments to stimulus", () => {
    expect(stimulusForNewMovement("weightlifting")).toBe("strength");
    expect(stimulusForNewMovement("skill")).toBe("skill");
    expect(stimulusForNewMovement("metcon")).toBe("skill");
  });

  it("formats rest durations", () => {
    expect(formatRestDuration(90)).toBe("1:30");
    expect(formatRestDuration(60)).toBe("1:00");
    expect(formatRestDuration(45)).toBe(":45");
    expect(formatRestDuration(null)).toBeNull();
  });

  it("parses rest durations", () => {
    expect(parseRestDuration("1:30")).toBe(90);
    expect(parseRestDuration("90")).toBe(90);
    expect(parseRestDuration(":45")).toBe(45);
    expect(parseRestDuration("")).toBeNull();
  });
});
