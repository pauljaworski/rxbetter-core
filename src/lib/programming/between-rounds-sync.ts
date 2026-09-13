import type { EditorLineItem } from "@/hooks/staff/types";
import type { BetweenRoundPrescriptionUnit } from "@/lib/programming/workout-scheme-schema";
import type { PrescriptionUnit } from "@/lib/programming/prescription-unit";
import type { RxVariants } from "@/lib/programming/rx-variants-schema";

export type BetweenRoundsSpec = {
  amount?: number | null;
  prescriptionUnit?: BetweenRoundPrescriptionUnit;
  label?: string;
};

function renumber(items: EditorLineItem[]): EditorLineItem[] {
  return items.map((it, i) => ({ ...it, sequence_number: i + 1 }));
}

function hasBetweenContent(br: BetweenRoundsSpec | null | undefined): boolean {
  if (!br) return false;
  return Boolean(br.label?.trim()) || br.amount != null;
}

function genderRx(amount: number | null, unit: PrescriptionUnit): RxVariants {
  const side = {
    reps: amount,
    prescription_unit: unit,
    weight_lb: null as number | null,
    load_label: null as string | null,
    height_label: null as string | null,
  };
  return { male: { ...side }, female: { ...side } };
}

/**
 * Keep a single trackable `between_rounds` line item in sync with scheme.betweenRounds.
 * Clears the item when between-rounds is empty.
 */
export function applyBetweenRoundsToItems(
  items: EditorLineItem[],
  between: BetweenRoundsSpec | null | undefined,
): EditorLineItem[] {
  const rest = items.filter((it) => it.line_item_kind !== "between_rounds");
  if (!hasBetweenContent(between)) {
    return renumber(rest);
  }

  const unit = (between?.prescriptionUnit ?? "meters") as PrescriptionUnit;
  const label = between?.label?.trim() || "Between rounds";
  const amount = between?.amount ?? null;
  const prev = items.find((it) => it.line_item_kind === "between_rounds");
  const catalogLinked = Boolean(prev?.benchmark_type_id);

  const next: EditorLineItem = {
    id: prev?.id,
    _new: prev?._new ?? true,
    sequence_number: rest.length + 1,
    reps_prescribed: amount,
    prescription_unit: unit,
    prescribed_weight: null,
    prescribed_percentage: null,
    prescribed_score: null,
    percent_rep_max: prev?.percent_rep_max ?? 1,
    benchmark_type_id: prev?.benchmark_type_id ?? null,
    benchmark_definition_id: prev?.benchmark_definition_id,
    bench_name: catalogLinked ? (prev?.bench_name ?? label) : label,
    movement_label: catalogLinked ? null : label,
    line_item_kind: "between_rounds",
    movement_components: [],
    rx_variants: genderRx(amount, unit),
    rest_sec: prev?.rest_sec,
    skip_pr_basis: prev?.skip_pr_basis,
  };

  return renumber([...rest, next]);
}
