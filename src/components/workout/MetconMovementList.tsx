import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import { AthletePrescriptionHeader } from "@/components/workout/AthletePrescriptionHeader";
import { resolvePrescriptionForAthlete, type RxGender } from "@/lib/programming/rx-variants-schema";

type Props = {
  items: LogLineItem[];
  rxGender?: RxGender | null;
};

export function MetconMovementList({ items, rxGender = null }: Props) {
  if (!items.length) return null;

  return (
    <div className="divide-y divide-border/60 border-b border-border/60">
      {items.map((it) => {
        const rx = resolvePrescriptionForAthlete(it, rxGender);
        const between = it.line_item_kind === "between_rounds";
        return (
          <div key={it.id} className="px-4 py-3 md:px-5">
            {between && (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary/80">
                Between rounds
              </p>
            )}
            <AthletePrescriptionHeader
              movementName={it.bench_name ?? "Movement"}
              repsPrescribed={rx.reps_prescribed}
              prescriptionUnit={rx.prescription_unit}
              prescribedWeight={rx.prescribed_weight}
              prescribedScore={rx.prescribed_score}
              dualAmountLabel={rx.dual_amount_label}
              dualModifierLabel={rx.dual_modifier_label}
              loadLabel={rx.load_label}
              heightLabel={rx.height_label}
              sequenceNumber={between ? null : it.sequence_number}
              compact
            />
          </div>
        );
      })}
    </div>
  );
}
