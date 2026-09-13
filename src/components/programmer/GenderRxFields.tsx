import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { EditorLineItem } from "@/hooks/staff/types";
import {
  emptyRxVariants,
  hasRxVariants,
  parseRxVariants,
  syncLegacyFieldsFromVariants,
  displayLoadAmount,
  displayHeightAmount,
  ensureLoadUnit,
  ensureHeightUnit,
  type LoadModality,
  type RxVariant,
  type RxVariants,
} from "@/lib/programming/rx-variants-schema";
import { PRESCRIPTION_UNITS, PRESCRIPTION_UNIT_LABELS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";
import { supportsDbKbLoadModality } from "@/lib/programming/manual-config";
import { DurationSecondsInput } from "@/components/programmer/DurationSecondsInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function UnitSuffixInput({
  label,
  value,
  suffix,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  placeholder?: string;
  onChange: (raw: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="flex h-8 items-center overflow-hidden rounded-md border border-input bg-background">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 border-0 text-xs shadow-none focus-visible:ring-0"
        />
        <span className="shrink-0 border-l border-border/60 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  );
}

type Props = {
  item: EditorLineItem;
  mode: "tracking_only" | "strength";
  onChange: (patch: Partial<EditorLineItem>) => void;
  /** Metcon: always show Male / Female columns (no opt-in checkbox). */
  alwaysSplit?: boolean;
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

/** Editor display: persisted variants or legacy columns seeded into Male and Female. */
function displayVariants(item: EditorLineItem): RxVariants {
  const parsed = parseRxVariants(item.rx_variants);
  const modality = parsed.load_modality ?? null;
  if (hasRxVariants(parsed)) {
    const male = parsed.male ?? {};
    const female = parsed.female ?? {};
    const maleHas =
      male.reps != null ||
      male.weight_lb != null ||
      (male.load_label?.trim().length ?? 0) > 0 ||
      (male.height_label?.trim().length ?? 0) > 0;
    const femaleHas =
      female.reps != null ||
      female.weight_lb != null ||
      (female.load_label?.trim().length ?? 0) > 0 ||
      (female.height_label?.trim().length ?? 0) > 0;
    // Prefill empty gender from the other so amounts aren't blank on one side.
    if (maleHas && !femaleHas) return { load_modality: modality, male, female: { ...male } };
    if (femaleHas && !maleHas) return { load_modality: modality, male: { ...female }, female };
    return { load_modality: modality, male, female };
  }
  const seed = seedVariant(item);
  return { load_modality: modality, male: { ...seed }, female: { ...seed } };
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

function commitVariants(
  item: EditorLineItem,
  variants: RxVariants,
  onChange: (patch: Partial<EditorLineItem>) => void,
) {
  const merged = { ...item, rx_variants: variants };
  const legacy = syncLegacyFieldsFromVariants(merged);
  onChange({
    rx_variants: variants,
    reps_prescribed: legacy.reps_prescribed,
    prescription_unit: legacy.prescription_unit as PrescriptionUnit | null | undefined,
    prescribed_weight: legacy.prescribed_weight,
    prescribed_score: legacy.prescribed_score,
  });
}

export function GenderRxFields({ item, mode, onChange, alwaysSplit = false }: Props) {
  const persisted = parseRxVariants(item.rx_variants);
  const enabled = alwaysSplit || hasRxVariants(persisted);
  const variants = displayVariants(item);
  const unit =
    variants.male?.prescription_unit ??
    variants.female?.prescription_unit ??
    (item.prescription_unit && item.prescription_unit !== "sets"
      ? item.prescription_unit
      : "reps");

  function toggleEnabled(checked: boolean) {
    if (!checked) {
      onChange({
        rx_variants: variants.load_modality
          ? { load_modality: variants.load_modality }
          : emptyRxVariants(),
      });
      return;
    }
    const seed = seedVariant(item);
    commitVariants(
      item,
      { load_modality: variants.load_modality, male: { ...seed }, female: { ...seed } },
      onChange,
    );
  }

  function setUnit(next: PrescriptionUnit) {
    const nextVariants: RxVariants = {
      load_modality: variants.load_modality,
      male: { ...variants.male, prescription_unit: next },
      female: { ...variants.female, prescription_unit: next },
    };
    commitVariants(item, nextVariants, onChange);
  }

  function setLoadModality(next: LoadModality | null) {
    const base = hasRxVariants(variants)
      ? variants
      : { male: { ...seedVariant(item) }, female: { ...seedVariant(item) } };
    commitVariants(
      item,
      {
        ...base,
        load_modality: next,
      },
      onChange,
    );
  }

  function patchVariant(gender: "male" | "female", patch: Partial<RxVariant>) {
    commitVariants(item, updateVariant(variants, gender, patch), onChange);
  }

  const showDbKb =
    mode === "strength" ||
    supportsDbKbLoadModality({
      stimulus: item.stimulus,
      purpose_variation: item.purpose_variation,
    });

  const modalitySelect = showDbKb ? (
    <div className="space-y-1">
      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
        DB / KB implement
      </Label>
      <Select
        value={variants.load_modality ?? "unset"}
        onValueChange={(v) => setLoadModality(v === "unset" ? null : (v as LoadModality))}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Not set (barbell / other)</SelectItem>
          <SelectItem value="single">Single dumbbell / kettlebell</SelectItem>
          <SelectItem value="double">Double dumbbells / kettlebells</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground">
        Double shows athletes 50s/35s — enter the weight of one DB or KB, not the total.
      </p>
    </div>
  ) : null;

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border/70 bg-muted/20 p-2">
      {!alwaysSplit && (
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Checkbox checked={enabled} onCheckedChange={(c) => toggleEnabled(c === true)} />
          <span className="font-medium">Gender-specific Rx (M / F)</span>
        </label>
      )}

      {alwaysSplit && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Rx by gender
        </p>
      )}

      {modalitySelect}

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
                    {PRESCRIPTION_UNIT_LABELS[u]}
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
                  {unit === "seconds" ? (
                    <DurationSecondsInput
                      label="Time"
                      value={v.reps ?? null}
                      onChange={(reps) => patchVariant(gender, { reps })}
                      inputKey={`${gender}-sec-${v.reps ?? "x"}`}
                    />
                  ) : (
                    <NumInput
                      label={mode === "tracking_only" ? "Amount" : "Reps"}
                      value={v.reps ?? null}
                      onChange={(reps) => patchVariant(gender, { reps })}
                    />
                  )}
                  {mode === "strength" ? (
                    <NumInput
                      label={variants.load_modality === "double" ? "Each (lb)" : "Weight (lb)"}
                      value={v.weight_lb ?? null}
                      onChange={(weight_lb) => patchVariant(gender, { weight_lb })}
                    />
                  ) : (
                    <>
                      <UnitSuffixInput
                        label={variants.load_modality === "double" ? "Each load" : "Load"}
                        value={displayLoadAmount(v.load_label)}
                        suffix="lbs"
                        placeholder={variants.load_modality === "double" ? "e.g. 50" : "e.g. 20"}
                        onChange={(raw) =>
                          patchVariant(gender, { load_label: ensureLoadUnit(raw) })
                        }
                      />
                      <UnitSuffixInput
                        label="Height"
                        value={displayHeightAmount(v.height_label)}
                        suffix="ft"
                        placeholder="e.g. 10"
                        onChange={(raw) =>
                          patchVariant(gender, { height_label: ensureHeightUnit(raw) })
                        }
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {alwaysSplit
              ? variants.load_modality === "double"
                ? "Athletes see (50s/35s) for double DB/KB. Leave blank for bodyweight."
                : "Enter load and height as numbers — lbs and ft are applied by default. Athletes see 20/14 and 10'/9'."
              : "Both tiers are Rx. Athletes see their profile gender; otherwise 15/12-style notation."}
          </p>
        </div>
      )}
    </div>
  );
}
