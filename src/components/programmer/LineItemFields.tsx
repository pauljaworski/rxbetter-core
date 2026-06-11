import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EditorLineItem } from "@/hooks/staff/types";
import { isComplexSetLineItem } from "@/lib/programming/complex-set-prescription";
import type { LineItemMode } from "@/lib/programming/manual-config";
import {
  PERCENT_REP_MAX_OPTIONS,
  percentFractionFromWhole,
  percentWholeFromFraction,
} from "@/lib/programming/percent-calculator";
import { PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";
import { GenderRxFields } from "@/components/programmer/GenderRxFields";
import { hasRxVariants, parseRxVariants } from "@/lib/programming/rx-variants-schema";

function NumInput({
  label,
  value,
  onChange,
  inputMode = "decimal",
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        className="h-8 font-mono-num text-xs"
      />
    </div>
  );
}

type Props = {
  mode: LineItemMode;
  item: EditorLineItem;
  onChange: (patch: Partial<EditorLineItem>) => void;
};

export function LineItemFields({ mode, item, onChange }: Props) {
  const genderRx = hasRxVariants(parseRxVariants(item.rx_variants));

  if (mode === "tracking_only") {
    return (
      <div className="space-y-2 pl-8">
        <GenderRxFields item={item} mode="tracking_only" onChange={onChange} alwaysSplit />
      </div>
    );
  }

  const repMax = item.percent_rep_max ?? 1;
  const pctDisplay = percentWholeFromFraction(item.prescribed_percentage);
  const complexSet = isComplexSetLineItem(item);

  return (
    <div className="space-y-2 pl-8">
      {!complexSet && !genderRx && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <NumInput
            label="reps"
            value={item.reps_prescribed}
            onChange={(v) => onChange({ reps_prescribed: v })}
          />
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              % basis
            </Label>
            <Select
              value={String(repMax)}
              onValueChange={(v) => onChange({ percent_rep_max: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERCENT_REP_MAX_OPTIONS.map((o) => (
                  <SelectItem key={o.repCount} value={String(o.repCount)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumInput
            label="percent"
            value={pctDisplay}
            inputMode="numeric"
            onChange={(v) => onChange({ prescribed_percentage: percentFractionFromWhole(v) })}
          />
          <NumInput
            label="weight (lb)"
            value={item.prescribed_weight}
            onChange={(v) => onChange({ prescribed_weight: v })}
          />
        </div>
      )}
      {!complexSet && genderRx && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              % basis
            </Label>
            <Select
              value={String(repMax)}
              onValueChange={(v) => onChange({ percent_rep_max: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERCENT_REP_MAX_OPTIONS.map((o) => (
                  <SelectItem key={o.repCount} value={String(o.repCount)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumInput
            label="percent"
            value={pctDisplay}
            inputMode="numeric"
            onChange={(v) => onChange({ prescribed_percentage: percentFractionFromWhole(v) })}
          />
        </div>
      )}
      {complexSet && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <NumInput
            label="Sets"
            value={item.reps_prescribed}
            onChange={(v) =>
              onChange({ reps_prescribed: v, prescription_unit: "sets" })
            }
          />
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              % basis
            </Label>
            <Select
              value={String(repMax)}
              onValueChange={(v) => onChange({ percent_rep_max: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERCENT_REP_MAX_OPTIONS.map((o) => (
                  <SelectItem key={o.repCount} value={String(o.repCount)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumInput
            label="percent"
            value={pctDisplay}
            inputMode="numeric"
            onChange={(v) => onChange({ prescribed_percentage: percentFractionFromWhole(v) })}
          />
        </div>
      )}
      {!complexSet && <GenderRxFields item={item} mode="strength" onChange={onChange} />}
      <p className="text-[10px] text-muted-foreground">
        {complexSet
          ? "Reps per movement come from the complex definition above (e.g. 2 Snatch Pull + 1 Power Snatch)."
          : genderRx
            ? "Percent applies to both genders; set M/F fixed weights when not using percent."
            : `Athletes see prescribed weight from their ${repMax}RM PR × percent. Override weight (lb) for a fixed load instead.`}
      </p>
    </div>
  );
}
