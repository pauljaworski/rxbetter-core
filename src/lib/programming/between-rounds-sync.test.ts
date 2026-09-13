import { describe, expect, it } from "vitest";
import { applyBetweenRoundsToItems } from "./between-rounds-sync";
import type { EditorLineItem } from "@/hooks/staff/types";

function item(partial: Partial<EditorLineItem> & { sequence_number: number }): EditorLineItem {
  return {
    reps_prescribed: 30,
    prescription_unit: "reps",
    prescribed_weight: null,
    prescribed_percentage: null,
    prescribed_score: null,
    benchmark_type_id: "t1",
    bench_name: "Thruster",
    line_item_kind: "metcon_movement",
    movement_components: [],
    ...partial,
  };
}

describe("applyBetweenRoundsToItems", () => {
  it("appends a between_rounds line item", () => {
    const items = [item({ sequence_number: 1 })];
    const next = applyBetweenRoundsToItems(items, {
      label: "Run",
      amount: 200,
      prescriptionUnit: "meters",
    });
    expect(next).toHaveLength(2);
    expect(next[1].line_item_kind).toBe("between_rounds");
    expect(next[1].bench_name).toBe("Run");
    expect(next[1].reps_prescribed).toBe(200);
    expect(next[1].prescription_unit).toBe("meters");
    expect(next[1].sequence_number).toBe(2);
  });

  it("updates existing between_rounds item in place", () => {
    const items = [
      item({ sequence_number: 1 }),
      item({
        sequence_number: 2,
        id: "br1",
        line_item_kind: "between_rounds",
        bench_name: "Run",
        benchmark_type_id: null,
        reps_prescribed: 100,
        prescription_unit: "meters",
      }),
    ];
    const next = applyBetweenRoundsToItems(items, {
      label: "Run",
      amount: 200,
      prescriptionUnit: "meters",
    });
    expect(next).toHaveLength(2);
    expect(next[1].id).toBe("br1");
    expect(next[1].reps_prescribed).toBe(200);
  });

  it("removes between_rounds when cleared", () => {
    const items = [
      item({ sequence_number: 1 }),
      item({
        sequence_number: 2,
        line_item_kind: "between_rounds",
        bench_name: "Run",
        benchmark_type_id: null,
      }),
    ];
    expect(applyBetweenRoundsToItems(items, undefined)).toHaveLength(1);
    expect(applyBetweenRoundsToItems(items, { label: "", amount: null })).toHaveLength(1);
  });
});
