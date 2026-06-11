import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import {
  formatComplexMovementTitle,
  parseMovementComponents,
} from "@/lib/programming/movement-components-schema";
import { isMetconSegment } from "@/lib/programming/manual-config";
import { prescriptionUnitForLineItem } from "@/lib/programming/complex-set-prescription";
import { formatPrescriptionAmount } from "@/lib/programming/prescription-unit";
import {
  percentRepMaxLabel,
  percentWholeFromFraction,
} from "@/lib/programming/percent-calculator";
import { schemeSummaryLabel, parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import {
  formatRxVariantsCompact,
  hasRxVariants,
  parseRxVariants,
} from "@/lib/programming/rx-variants-schema";

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
  const kind = item.line_item_kind ?? "strength_set";
  const parts: string[] = [name];

  const variants = parseRxVariants(item.rx_variants);
  const dualRx = hasRxVariants(variants)
    ? formatRxVariantsCompact(variants, item.prescription_unit)
    : null;

  if (dualRx) {
    if (kind === "complex_set") parts.unshift(dualRx);
    else parts.push(dualRx);
  } else if (item.reps_prescribed != null) {
    const amount = formatPrescriptionAmount(
      item.reps_prescribed,
      prescriptionUnitForLineItem(item),
    );
    if (amount) {
      if (kind === "complex_set") parts.unshift(amount);
      else parts.push(amount);
    }
  }

  const pct = percentSuffix(item);
  if (pct) parts.push(pct);
  else if (!dualRx && item.prescribed_weight != null) parts.push(`${item.prescribed_weight} lb`);
  else if (!dualRx && item.prescribed_score?.trim()) parts.push(item.prescribed_score.trim());

  if (kind === "complex_set") {
    return parts.join(" · ");
  }
  return parts.length > 1 ? parts.join(" · ") : name;
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
