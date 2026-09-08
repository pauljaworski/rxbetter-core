import { formatPrescriptionTitle } from "@/lib/programming/prescription-display";
import { cn } from "@/lib/utils";

type Props = {
  movementName: string;
  /** Optional second line (e.g. full multi-move circuit under "Set 2 of 4"). */
  subtitle?: string | null;
  repsPrescribed?: number | null;
  prescriptionUnit?: string | null;
  prescribedPercentage?: number | null;
  repMaxCount?: number | null;
  prescribedWeight?: number | null;
  prescribedScore?: string | null;
  dualAmountLabel?: string | null;
  dualModifierLabel?: string | null;
  loadLabel?: string | null;
  heightLabel?: string | null;
  sequenceNumber?: number | null;
  className?: string;
  compact?: boolean;
};

export function AthletePrescriptionHeader({
  movementName,
  subtitle,
  repsPrescribed,
  prescriptionUnit,
  prescribedPercentage,
  repMaxCount,
  prescribedWeight,
  prescribedScore,
  dualAmountLabel,
  dualModifierLabel,
  loadLabel,
  heightLabel,
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
    dualModifierLabel,
    loadLabel,
    heightLabel,
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
      <div className="min-w-0">
        <h4
          className={cn(
            "min-w-0 font-black leading-tight tracking-tight text-foreground",
            compact ? "text-base md:text-lg" : "text-xl md:text-2xl",
          )}
        >
          {title}
        </h4>
        {subtitle && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground md:text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
