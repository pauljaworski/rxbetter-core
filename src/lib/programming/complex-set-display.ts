import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import type { EditorLineItem } from "@/hooks/staff/types";
import {
  formatComplexMovementTitle,
  parseMovementComponents,
  type MovementComponent,
} from "@/lib/programming/movement-components-schema";
import { isComplexSetLineItem } from "@/lib/programming/complex-set-prescription";

type Complexish = {
  line_item_kind?: string | null;
  movement_components?: unknown;
  rest_sec?: number | null;
  movement_label?: string | null;
  bench_name?: string | null;
  prescribed_percentage?: number | null;
  prescribed_weight?: number | null;
  benchmark_type_id?: string | null;
};

export function complexCircuitTitle(item: Complexish): string | null {
  const components = parseMovementComponents(item.movement_components);
  if (components.length) {
    return formatComplexMovementTitle(components, { restBetweenSetsSec: item.rest_sec });
  }
  if (isComplexSetLineItem(item)) {
    const label = (item.movement_label ?? item.bench_name ?? "").trim();
    return label || null;
  }
  return null;
}

function componentsKey(components: MovementComponent[], restSec: number | null | undefined): string {
  return JSON.stringify({
    rest: restSec ?? null,
    c: components.map((x) => ({
      id: x.benchmark_type_id,
      r: x.reps,
      u: x.unit ?? "reps",
      l: x.label,
      ra: x.rest_after_sec ?? null,
    })),
  });
}

/** True when two rows are the same multi-move prescription (one set of a repeated block). */
export function isSameComplexPrescription(a: Complexish, b: Complexish): boolean {
  if (!isComplexSetLineItem(a) || !isComplexSetLineItem(b)) return false;
  const ca = parseMovementComponents(a.movement_components);
  const cb = parseMovementComponents(b.movement_components);
  if (ca.length && cb.length) {
    return (
      componentsKey(ca, a.rest_sec) === componentsKey(cb, b.rest_sec) &&
      (a.prescribed_percentage ?? null) === (b.prescribed_percentage ?? null) &&
      (a.prescribed_weight ?? null) === (b.prescribed_weight ?? null) &&
      (a.benchmark_type_id ?? null) === (b.benchmark_type_id ?? null)
    );
  }
  const la = (a.movement_label ?? a.bench_name ?? "").trim().toLowerCase();
  const lb = (b.movement_label ?? b.bench_name ?? "").trim().toLowerCase();
  return !!la && la === lb;
}

export type ComplexSetRun = {
  startIndex: number;
  count: number;
  circuitTitle: string;
};

/** Find the run of identical complex_set rows that includes index `idx`. */
export function findComplexSetRun(
  items: Complexish[],
  idx: number,
): ComplexSetRun | null {
  const item = items[idx];
  if (!item || !isComplexSetLineItem(item)) return null;
  const title = complexCircuitTitle(item);
  if (!title) return null;

  let start = idx;
  while (start > 0 && isSameComplexPrescription(items[start - 1], item)) start--;
  let end = idx;
  while (end + 1 < items.length && isSameComplexPrescription(items[end + 1], item)) end++;

  return {
    startIndex: start,
    count: end - start + 1,
    circuitTitle: title,
  };
}

/** Staff / athlete row label: "Set 2 of 4" when part of a multi-set complex block. */
export function complexSetRowLabel(
  items: Complexish[],
  idx: number,
): { title: string; subtitle: string | null } {
  const run = findComplexSetRun(items, idx);
  if (!run) {
    const fallback =
      complexCircuitTitle(items[idx] ?? {}) ??
      items[idx]?.bench_name ??
      items[idx]?.movement_label ??
      "Movement";
    return { title: fallback, subtitle: null };
  }
  const setNum = idx - run.startIndex + 1;
  if (run.count === 1) {
    return { title: run.circuitTitle, subtitle: null };
  }
  return {
    title: `Set ${setNum} of ${run.count}`,
    subtitle: run.circuitTitle,
  };
}

export function editorComplexSetRowLabel(
  items: EditorLineItem[],
  idx: number,
): { title: string; subtitle: string | null } {
  return complexSetRowLabel(items, idx);
}

export function logComplexSetRowLabel(
  items: LogLineItem[],
  idx: number,
): { title: string; subtitle: string | null } {
  return complexSetRowLabel(items, idx);
}
