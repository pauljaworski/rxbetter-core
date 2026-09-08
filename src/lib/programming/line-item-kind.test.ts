import { describe, expect, it } from "vitest";
import { isLoggableLineItem } from "./line-item-kind";

describe("isLoggableLineItem", () => {
  it("excludes rest from athlete logging", () => {
    expect(isLoggableLineItem("rest")).toBe(false);
  });

  it("treats lifts, notes, and metcon movements as loggable", () => {
    expect(isLoggableLineItem("strength_set")).toBe(true);
    expect(isLoggableLineItem("complex_set")).toBe(true);
    expect(isLoggableLineItem("metcon_movement")).toBe(true);
    expect(isLoggableLineItem("note")).toBe(true);
    expect(isLoggableLineItem(null)).toBe(true);
  });
});
