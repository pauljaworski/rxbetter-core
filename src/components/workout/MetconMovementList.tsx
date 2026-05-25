import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import { AthletePrescriptionHeader } from "@/components/workout/AthletePrescriptionHeader";

type Props = {
  items: LogLineItem[];
};

export function MetconMovementList({ items }: Props) {
  if (!items.length) return null;

  return (
    <div className="divide-y divide-border/60 border-b border-border/60">
      {items.map((it) => (
        <div key={it.id} className="px-4 py-3 md:px-5">
          <AthletePrescriptionHeader
            movementName={it.bench_name ?? "Movement"}
            repsPrescribed={it.reps_prescribed}
            prescriptionUnit={it.prescription_unit}
            prescribedWeight={it.prescribed_weight}
            prescribedScore={it.prescribed_score}
            sequenceNumber={it.sequence_number}
            compact
          />
        </div>
      ))}
    </div>
  );
}
