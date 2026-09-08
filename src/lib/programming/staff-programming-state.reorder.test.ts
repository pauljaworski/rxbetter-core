import { describe, expect, it } from "vitest";
import { canReorderLineItem, reorderLineItems } from "./staff-programming-state";

describe("reorderLineItems", () => {
  const items = [
    { sequence_number: 1, label: "A" },
    { sequence_number: 2, label: "B" },
    { sequence_number: 3, label: "C" },
  ];

  it("moves an item up and renumbers", () => {
    const next = reorderLineItems(items, 2, "up");
    expect(next.map((i) => i.label)).toEqual(["A", "C", "B"]);
    expect(next.map((i) => i.sequence_number)).toEqual([1, 2, 3]);
  });

  it("moves an item down", () => {
    const next = reorderLineItems(items, 0, "down");
    expect(next.map((i) => i.label)).toEqual(["B", "A", "C"]);
  });

  it("no-ops at edges", () => {
    expect(reorderLineItems(items, 0, "up")).toEqual(items);
    expect(reorderLineItems(items, 2, "down")).toEqual(items);
    expect(canReorderLineItem(3, 0, "up")).toBe(false);
    expect(canReorderLineItem(3, 2, "down")).toBe(false);
  });
});
