import { describe, expect, it } from "vitest";
import {
  isGroupBlockComplete,
  isPrescriptionSegmentComplete,
} from "./segment-completion";

describe("segment-completion", () => {
  it("metcon segment complete with segment score", () => {
    expect(isPrescriptionSegmentComplete("metcon", [], new Set(), true)).toBe(true);
    expect(isPrescriptionSegmentComplete("metcon", ["a"], new Set(), false)).toBe(false);
  });

  it("strength segment complete when all PLIs logged", () => {
    expect(
      isPrescriptionSegmentComplete(
        "weightlifting",
        ["a", "b"],
        new Set(["a", "b"]),
        false,
      ),
    ).toBe(true);
    expect(
      isPrescriptionSegmentComplete("weightlifting", ["a", "b"], new Set(["a"]), false),
    ).toBe(false);
  });

  it("group block complete with group score", () => {
    expect(isGroupBlockComplete(true)).toBe(true);
    expect(isGroupBlockComplete(false)).toBe(false);
  });
});
