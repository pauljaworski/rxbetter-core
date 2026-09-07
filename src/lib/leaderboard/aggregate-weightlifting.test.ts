import { describe, expect, it } from "vitest";
import { aggregateWeightliftingBoardRows } from "./aggregate-weightlifting";

describe("aggregateWeightliftingBoardRows", () => {
  const items = ["a", "b", "c"];

  it("requires every set logged", () => {
    const rows = aggregateWeightliftingBoardRows("prog", items, [
      {
        id: "1",
        contact_id: "c1",
        programming_id: "prog",
        programming_line_item_id: "a",
        weight_lifted: 200,
        status: "completed",
        workout_scale: "rx",
      },
      {
        id: "2",
        contact_id: "c1",
        programming_id: "prog",
        programming_line_item_id: "b",
        weight_lifted: 205,
        status: "completed",
        workout_scale: "rx",
      },
    ]);
    expect(rows).toHaveLength(0);
  });

  it("aggregates complete sessions with top weight", () => {
    const rows = aggregateWeightliftingBoardRows("prog", items, [
      {
        id: "1",
        contact_id: "c1",
        programming_id: "prog",
        programming_line_item_id: "a",
        weight_lifted: 200,
        status: "completed",
        workout_scale: "rx",
      },
      {
        id: "2",
        contact_id: "c1",
        programming_id: "prog",
        programming_line_item_id: "b",
        weight_lifted: 210,
        status: "completed",
        workout_scale: "rx",
      },
      {
        id: "3",
        contact_id: "c1",
        programming_id: "prog",
        programming_line_item_id: "c",
        weight_lifted: 205,
        status: "completed",
        workout_scale: "rx",
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBe("210 lb · 3 sets");
    expect(rows[0].result_value).toBe(210);
  });
});
