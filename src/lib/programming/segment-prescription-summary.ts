import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import {
  formatComplexMovementTitle,
  parseMovementComponents,
} from "@/lib/programming/movement-components-schema";
import { isMetconSegment } from "@/lib/programming/manual-config";
import {
  percentRepMaxLabel,
  percentWholeFromFraction,
} from "@/lib/programming/percent-calculator";
import { schemeSummaryLabel, parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import { formatPrescriptionFromResolved } from "@/lib/programming/prescription-display";
import {
  resolvePrescriptionForAthlete,
  type RxGender,
} from "@/lib/programming/rx-variants-schema";
import {
  complexCircuitTitle,
  isSameComplexPrescription,
} from "@/lib/programming/complex-set-display";
import { isComplexSetLineItem } from "@/lib/programming/complex-set-prescription";

export type SegmentSummaryInput = {
  programming_segment: string;
  metcon_format?: string | null;
  workout_scheme?: unknown;
  name?: string | null;
};

function loadLabel(item: LogLineItem): string {
  const circuit = complexCircuitTitle(item);
  if (circuit) return circuit;
  if (item.line_item_kind === "rest") {
    const sec = item.rest_sec ?? item.reps_prescribed;
    if (sec != null && sec > 0) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `Rest ${m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `:${String(s).padStart(2, "0")}`}`;
    }
    return "Rest";
  }
  return item.bench_name ?? "Movement";
}

function percentSuffix(item: LogLineItem): string | null {
  const pct = percentWholeFromFraction(item.prescribed_percentage);
  if (pct == null) return null;
  return `${pct}% ${percentRepMaxLabel(1).replace("% ", "")}`;
}

/** One-line summary for a prescription line item (strength / complex / accessory). */
export function summarizeLineItemBrief(
  item: LogLineItem,
  athleteGender: RxGender | null = null,
): string {
  const name = loadLabel(item);
  const resolved = resolvePrescriptionForAthlete(item, athleteGender);
  const rxTitle = formatPrescriptionFromResolved(name, resolved, {
    prescribedPercentage: item.prescribed_percentage,
  });
  if (rxTitle === name) {
    const pct = percentSuffix(item);
    if (pct) return `${name} · ${pct}`;
    if (item.prescribed_weight != null) return `${name} · ${item.prescribed_weight} lb`;
  }
  return rxTitle;
}

export type SegmentPrescriptionSummary = {
  /** Format / count shown above the movement list (e.g. "4 RFT · 22 min cap" or "5 sets"). */
  header: string | null;
  lines: string[];
};

/**
 * Collapse consecutive identical complex_set rows into one prescription line
 * so athletes/staff see the circuit once under an "N sets" header.
 */
export function collapseStrengthPrescriptionLines(
  items: LogLineItem[],
  athleteGender: RxGender | null = null,
): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < items.length) {
    const it = items[i];
    if (isComplexSetLineItem(it)) {
      let run = 1;
      while (i + run < items.length && isSameComplexPrescription(it, items[i + run])) {
        run++;
      }
      lines.push(summarizeLineItemBrief(it, athleteGender));
      i += run;
      continue;
    }
    lines.push(summarizeLineItemBrief(it, athleteGender));
    i++;
  }
  return lines;
}

export function summarizeSegmentPrescription(
  wod: SegmentSummaryInput,
  items: LogLineItem[],
  athleteGender: RxGender | null = null,
): SegmentPrescriptionSummary {
  if (isMetconSegment(wod.programming_segment)) {
    const scheme = parseWorkoutScheme(wod.workout_scheme);
    const schemeLabel = schemeSummaryLabel(scheme);
    const lines = items.length
      ? items.map((it) => summarizeLineItemBrief(it, athleteGender))
      : [];
    return {
      header: schemeLabel,
      lines,
    };
  }

  if (!items.length) {
    return { header: "No prescribed sets", lines: [] };
  }

  const setCount = items.filter((it) => it.line_item_kind !== "rest" && it.line_item_kind !== "note")
    .length;

  return {
    header: `${setCount} ${setCount === 1 ? "set" : "sets"}`,
    lines: collapseStrengthPrescriptionLines(items, athleteGender),
  };
}
