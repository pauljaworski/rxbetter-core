import { describe, expect, it } from "vitest";
import {
  formatDurationSeconds,
  formatPrescriptionAmount,
  inferUnitFromToken,
  parseDurationSeconds,
} from "./prescription-unit";

describe("prescription-unit time", () => {
  it("formats and parses m:ss including 0:60", () => {
    expect(formatDurationSeconds(60)).toBe("1:00");
    expect(formatDurationSeconds(45)).toBe("0:45");
    expect(parseDurationSeconds("0:60")).toBe(60);
    expect(parseDurationSeconds("1:00")).toBe(60);
    expect(parseDurationSeconds("90")).toBe(90);
  });

  it("formats prescription amounts for seconds", () => {
    expect(formatPrescriptionAmount(60, "seconds")).toBe("1:00");
    expect(formatPrescriptionAmount(45, "seconds")).toBe("0:45");
  });

  it("infers time from tokens", () => {
    expect(inferUnitFromToken("0:60 Ski Erg")).toEqual({
      amount: 60,
      unit: "seconds",
      label: "Ski Erg",
    });
    expect(inferUnitFromToken("90s Assault Bike")).toEqual({
      amount: 90,
      unit: "seconds",
      label: "Assault Bike",
    });
  });
});
