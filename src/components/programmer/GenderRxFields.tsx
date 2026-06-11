import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { EditorLineItem } from "@/hooks/staff/types";
import {
  emptyRxVariants,
  hasRxVariants,
  parseRxVariants,
  type RxVariant,
  type RxVariants,
} from "@/lib/programming/rx-variants-schema";
import { PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        inputMode="numeric"
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
  item: EditorLineItem;
  mode: "tracking_only" | "strength";
  onChange: (patch: Partial<EditorLineItem>) => void;
};

function seedVariant(item: EditorLineItem): RxVariant {
  return {
    reps: item.reps_prescribed,
    prescription_unit:
      item.prescription_unit && item.prescription_unit !== "sets"
        ? (item.prescription_unit as PrescriptionUnit)
        : "reps",
    weight_lb: item.prescribed_weight,
    load_label: item.prescribed_score,
  };
}

function updateVariant(
  variants: RxVariants,
  gender: "male" | "female",
  patch: Partial<RxVariant>,
): RxVariants {
  const current = variants[gender] ?? {};
  return {
    ...variants,
    [gender]: { ...current, ...patch },
  };
}

export function GenderRxFields({ item, mode, onChange }: Props) {
  const variants = parseRxVariants(item.rx_variants);
  const enabled = hasRxVariants(variants);
  const unit =
    variants.male?.prescription_unit ??
    variants.female?.prescription_unit ??
    (item.prescription_unit && item.prescription_unit !== "sets"
      ? item.prescription_unit
      : "reps");

  function toggleEnabled(checked: boolean) {
    if (!checked) {
      onChange({ rx_variants: emptyRxVariants() });
      return;
    }
    const seed = seedVariant(item);
    onChange({
      rx_variants: { male: { ...seed }, female: { ...seed } },
    });
  }

  function setUnit(next: PrescriptionUnit) {
    onChange({
      prescription_unit: next,
      rx_variants: {
        male: { ...variants.male, prescription_unit: next },
        female: { ...variants.female, prescription_unit: next },
      },
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border/70 bg-muted/20 p-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox checked={enabled} onCheckedChange={(c) => toggleEnabled(c === true)} />
        <span className="font-medium">Gender-specific Rx (M / F)</span>
      </label>

      {enabled && (
        <div className="space-y-2">
          {mode === "tracking_only" && (
            <div className="space-y-1">
              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Unit (shared)
              </Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={unit}
                onChange={(e) => setUnit(e.target.value as PrescriptionUnit)}
              >
                {PRESCRIPTION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((gender) => {
              const v = variants[gender] ?? {};
              const label = gender === "male" ? "Male Rx" : "Female Rx";
              return (
                <div key={gender} className="space-y-2 rounded border border-border/50 p-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <NumInput
                    label={mode === "tracking_only" ? "Amount" : "Reps"}
                    value={v.reps ?? null}
                    onChange={(reps) =>
                      onChange({
                        rx_variants: updateVariant(variants, gender, { reps }),
                      })
                    }
                  />
                  {mode === "strength" ? (
                    <NumInput
                      label="Weight (lb)"
                      value={v.weight_lb ?? null}
                      onChange={(weight_lb) =>
                        onChange({
                          rx_variants: updateVariant(variants, gender, { weight_lb }),
                        })
                      }
                    />
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        Rx load
                      </Label>
                      <Input
                        value={v.load_label ?? ""}
                        onChange={(e) =>
                          onChange({
                            rx_variants: updateVariant(variants, gender, {
                              load_label: e.target.value || null,
                            }),
                          })
                        }
                        placeholder="e.g. 30 lb"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Both tiers are Rx. Athletes see their profile gender; otherwise 15/12-style notation.
          </p>
        </div>
      )}
    </div>
  );
}
