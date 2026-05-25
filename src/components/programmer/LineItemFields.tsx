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
import type { LineItemMode } from "@/lib/programming/manual-config";
import {
  PERCENT_REP_MAX_OPTIONS,
  percentFractionFromWhole,
  percentWholeFromFraction,
} from "@/lib/programming/percent-calculator";
import { PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";

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
  if (mode === "tracking_only") {
    const unit = item.prescription_unit ?? "reps";
    const amountLabel =
      unit === "meters"
        ? "meters"
        : unit === "calories"
          ? "calories"
          : unit === "feet"
            ? "feet"
            : "reps";
    return (
      <div className="grid grid-cols-2 gap-2 pl-8 md:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Unit</Label>
          <Select
            value={unit}
            onValueChange={(v) => onChange({ prescription_unit: v as PrescriptionUnit })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESCRIPTION_UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <NumInput
          label={amountLabel}
          value={item.reps_prescribed}
          onChange={(v) => onChange({ reps_prescribed: v })}
        />
        <div className="space-y-1">
          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Rx load</Label>
          <Input
            value={item.prescribed_score ?? ""}
            onChange={(e) => onChange({ prescribed_score: e.target.value || null })}
            placeholder="e.g. 30/20 lb"
            className="h-8 text-xs"
          />
        </div>
      </div>
    );
  }

  const repMax = item.percent_rep_max ?? 1;
  const pctDisplay = percentWholeFromFraction(item.prescribed_percentage);

  return (
    <div className="space-y-2 pl-8">
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
      <p className="text-[10px] text-muted-foreground">
        Athletes see prescribed weight from their {repMax}RM PR × percent. Override weight (lb) for
        a fixed load instead.
      </p>
    </div>
  );
}
