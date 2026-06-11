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
import { resolvePrescriptionForAthlete } from "@/lib/programming/rx-variants-schema";

export type SegmentSummaryInput = {
  programming_segment: string;
  metcon_format?: string | null;
  workout_scheme?: unknown;
  name?: string | null;
};

function loadLabel(item: LogLineItem): string {
  const components = parseMovementComponents(item.movement_components);
  if (components.length) return formatComplexMovementTitle(components);
  return item.bench_name ?? "Movement";
}

function percentSuffix(item: LogLineItem): string | null {
  const pct = percentWholeFromFraction(item.prescribed_percentage);
  if (pct == null) return null;
  return `${pct}% ${percentRepMaxLabel(1).replace("% ", "")}`;
}

/** One-line summary for a prescription line item (strength / complex / accessory). */
export function summarizeLineItemBrief(item: LogLineItem): string {
  const name = loadLabel(item);
  const resolved = resolvePrescriptionForAthlete(item, null);
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

export function summarizeSegmentPrescription(
  wod: SegmentSummaryInput,
  items: LogLineItem[],
): { lines: string[]; footer: string | null } {
  if (isMetconSegment(wod.programming_segment)) {
    const scheme = parseWorkoutScheme(wod.workout_scheme);
    const schemeLabel = schemeSummaryLabel(scheme);
    const lines = items.length
      ? items.map((it) => summarizeLineItemBrief(it))
      : schemeLabel
        ? []
        : [];
    const footer =
      schemeLabel && items.length
        ? schemeLabel
        : schemeLabel
          ? null
          : items.length
            ? `${items.length} movement${items.length === 1 ? "" : "s"}`
            : null;
    return { lines, footer };
  }

  if (!items.length) {
    return { lines: [], footer: "No prescribed sets" };
  }

  return {
    lines: items.map((it) => summarizeLineItemBrief(it)),
    footer: `${items.length} line item${items.length === 1 ? "" : "s"}`,
  };
}
