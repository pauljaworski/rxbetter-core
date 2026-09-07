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
import { GenderRxFields } from "@/components/programmer/GenderRxFields";
import {
  formatRestDuration,
  parseRestDuration,
} from "@/lib/programming/gym-benchmark-type";
import { Checkbox } from "@/components/ui/checkbox";

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
  if (item.line_item_kind === "rest") {
    return (
      <div className="space-y-1 pl-8">
        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
          Rest (m:ss)
        </Label>
        <Input
          className="h-8 w-28 font-mono-num text-xs"
          placeholder="1:30"
          defaultValue={formatRestDuration(item.rest_sec ?? item.reps_prescribed) ?? ""}
          key={`rest-line-${item.id ?? item.sequence_number}-${item.rest_sec ?? "x"}`}
          onBlur={(e) => {
            const sec = parseRestDuration(e.target.value);
            onChange({
              rest_sec: sec,
              reps_prescribed: sec,
              movement_label: "Rest",
              bench_name: sec != null ? `Rest ${formatRestDuration(sec)}` : "Rest",
            });
          }}
        />
      </div>
    );
  }

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
  const usePrPercent = !item.skip_pr_basis && pctDisplay != null;

  return (
    <div className="space-y-2 pl-8">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={!item.skip_pr_basis}
          onCheckedChange={(c) => {
            const on = c === true;
            onChange(
              on
                ? { skip_pr_basis: false }
                : {
                    skip_pr_basis: true,
                    prescribed_percentage: null,
                  },
            );
          }}
        />
        Use % of PR for prescribed load
      </label>
      {!complexSet && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
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
              disabled={item.skip_pr_basis}
              onValueChange={(v) => onChange({ percent_rep_max: Number(v), skip_pr_basis: false })}
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
            value={item.skip_pr_basis ? null : pctDisplay}
            inputMode="numeric"
            onChange={(v) =>
              onChange({
                prescribed_percentage: percentFractionFromWhole(v),
                skip_pr_basis: false,
              })
            }
          />
          <NumInput
            label="weight (lb)"
            value={item.prescribed_weight}
            onChange={(v) => onChange({ prescribed_weight: v })}
          />
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Rest after
            </Label>
            <Input
              className="h-8 font-mono-num text-xs"
              placeholder="1:30"
              defaultValue={formatRestDuration(item.rest_sec) ?? ""}
              key={`rest-${item.id ?? item.sequence_number}-${item.rest_sec ?? "x"}`}
              onBlur={(e) => onChange({ rest_sec: parseRestDuration(e.target.value) })}
            />
          </div>
        </div>
      )}
      {complexSet && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              % basis
            </Label>
            <Select
              value={String(repMax)}
              disabled={item.skip_pr_basis}
              onValueChange={(v) => onChange({ percent_rep_max: Number(v), skip_pr_basis: false })}
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
            value={item.skip_pr_basis ? null : pctDisplay}
            inputMode="numeric"
            onChange={(v) =>
              onChange({
                prescribed_percentage: percentFractionFromWhole(v),
                skip_pr_basis: false,
              })
            }
          />
          <NumInput
            label="weight (lb)"
            value={item.prescribed_weight}
            onChange={(v) => onChange({ prescribed_weight: v })}
          />
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Rest between sets
            </Label>
            <Input
              className="h-8 font-mono-num text-xs"
              placeholder="1:30"
              defaultValue={formatRestDuration(item.rest_sec) ?? ""}
              key={`crest-${item.id ?? item.sequence_number}-${item.rest_sec ?? "x"}`}
              onBlur={(e) => onChange({ rest_sec: parseRestDuration(e.target.value) })}
            />
          </div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">
        {item.skip_pr_basis
          ? "No PR % — athletes won’t see a calculated load from their vault. Use fixed weight (lb) or coach cues."
          : complexSet
            ? "One line item = one set. Movement amounts are in the title (e.g. 8 BSS, 12 RDL, Rest 1:30)."
            : usePrPercent
              ? `Athletes see prescribed weight from their ${repMax}RM PR × percent. Override weight (lb) for a fixed load instead.`
              : `Leave percent empty for no PR-based load, or enter % of ${repMax}RM. Override weight (lb) for a fixed load.`}
      </p>
    </div>
  );
}
