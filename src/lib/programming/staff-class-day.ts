import type {
  StaffClassLineItem,
  StaffClassPerformance,
  StaffClassWod,
} from "@/hooks/staff/types";

/** Split class-day rows: lifts live on line items; metcon totals live on the segment. */
export function partitionStaffClassPerformances(
  perfs: StaffClassPerformance[],
): {
  perfByItem: Map<string, StaffClassPerformance[]>;
  perfBySegment: Map<string, StaffClassPerformance[]>;
} {
  const perfByItem = new Map<string, StaffClassPerformance[]>();
  const perfBySegment = new Map<string, StaffClassPerformance[]>();

  for (const p of perfs) {
    if (p.programming_line_item_id) {
      const arr = perfByItem.get(p.programming_line_item_id) ?? [];
      arr.push(p);
      perfByItem.set(p.programming_line_item_id, arr);
      continue;
    }
    const score = p.score?.trim();
    if (p.programming_id && score) {
      const arr = perfBySegment.get(p.programming_id) ?? [];
      arr.push(p);
      perfBySegment.set(p.programming_id, arr);
    }
  }

  return { perfByItem, perfBySegment };
}

export function countStaffClassScores(
  perfByItem: Map<string, StaffClassPerformance[]>,
  perfBySegment: Map<string, StaffClassPerformance[]>,
): number {
  let n = 0;
  for (const arr of perfByItem.values()) n += arr.length;
  for (const arr of perfBySegment.values()) n += arr.length;
  return n;
}

/** Synthetic line item so EditScoreSheet can title a segment-level result. */
export function workoutResultLineItem(wod: StaffClassWod): StaffClassLineItem {
  return {
    id: `segment:${wod.id}`,
    programming_id: wod.id,
    sequence_number: null,
    reps_prescribed: null,
    prescribed_weight: null,
    prescribed_percentage: null,
    prescribed_score: null,
    benchmark_type_id: null,
    bench_name: wod.name?.trim() || "Workout result",
  };
}

export function staffClassScoreDisplay(p: StaffClassPerformance): string {
  if (p.weight_lifted != null) return `${p.weight_lifted} lb`;
  return p.score?.trim() || "—";
}
