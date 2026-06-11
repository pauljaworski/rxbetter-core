import { formatPrescriptionTitle } from "@/lib/programming/prescription-display";
import { cn } from "@/lib/utils";

type Props = {
  movementName: string;
  repsPrescribed?: number | null;
  prescriptionUnit?: string | null;
  prescribedPercentage?: number | null;
  repMaxCount?: number | null;
  prescribedWeight?: number | null;
  prescribedScore?: string | null;
  dualAmountLabel?: string | null;
  sequenceNumber?: number | null;
  className?: string;
  compact?: boolean;
};

export function AthletePrescriptionHeader({
  movementName,
  repsPrescribed,
  prescriptionUnit,
  prescribedPercentage,
  repMaxCount,
  prescribedWeight,
  prescribedScore,
  dualAmountLabel,
  sequenceNumber,
  className,
  compact,
}: Props) {
  const title = formatPrescriptionTitle({
    movementName,
    repsPrescribed,
    prescriptionUnit,
    prescribedPercentage,
    repMaxCount,
    prescribedWeight,
    prescribedScore,
    dualAmountLabel,
  });

  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      {sequenceNumber != null && (
        <span
          className={cn(
            "font-mono-num inline-grid shrink-0 place-items-center rounded-md bg-secondary font-bold text-muted-foreground",
            compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
          )}
        >
          {sequenceNumber}
        </span>
      )}
      <h4
        className={cn(
          "min-w-0 font-black leading-tight tracking-tight text-foreground",
          compact ? "text-base md:text-lg" : "text-xl md:text-2xl",
        )}
      >
        {title}
      </h4>
    </div>
  );
}
