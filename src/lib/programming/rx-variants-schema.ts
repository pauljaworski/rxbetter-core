import { z } from "zod";
import { formatPrescriptionAmount, PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";

export const RX_GENDERS = ["male", "female"] as const;
export type RxGender = (typeof RX_GENDERS)[number];

const rxVariantSchema = z.object({
  reps: z.number().nullable().optional(),
  prescription_unit: z.enum(PRESCRIPTION_UNITS).optional(),
  weight_lb: z.number().nullable().optional(),
  /** Load prescription (e.g. "20 lb" wall ball). */
  load_label: z.string().max(80).nullable().optional(),
  /** Target height (e.g. "10 ft" box jump). */
  height_label: z.string().max(80).nullable().optional(),
});

export const rxVariantsSchema = z.object({
  male: rxVariantSchema.optional(),
  female: rxVariantSchema.optional(),
});

export type RxVariant = z.infer<typeof rxVariantSchema>;
export type RxVariants = z.infer<typeof rxVariantsSchema>;

export function emptyRxVariants(): RxVariants {
  return {};
}

export function parseRxVariants(raw: unknown): RxVariants {
  if (raw == null) return emptyRxVariants();
  const parsed = rxVariantsSchema.safeParse(raw);
  return parsed.success ? parsed.data : emptyRxVariants();
}

function variantHasData(v: RxVariant | undefined): boolean {
  if (!v) return false;
  return (
    v.reps != null ||
    v.weight_lb != null ||
    (v.load_label?.trim().length ?? 0) > 0 ||
    (v.height_label?.trim().length ?? 0) > 0
  );
}

export function hasRxVariants(variants: RxVariants): boolean {
  return variantHasData(variants.male) || variantHasData(variants.female);
}

export function rxVariantsEnabled(variants: RxVariants): boolean {
  return variantHasData(variants.male) && variantHasData(variants.female);
}

function unitSuffix(unit: PrescriptionUnit | string | null | undefined): string {
  switch (unit) {
    case "calories":
      return " cal";
    case "meters":
      return "m";
    case "feet":
      return " ft";
    case "sets":
      return " sets";
    default:
      return "";
  }
}

function variantAmountLabel(
  v: RxVariant,
  fallbackUnit?: PrescriptionUnit | string | null,
): string | null {
  if (v.reps == null) return null;
  const unit = v.prescription_unit ?? fallbackUnit ?? "reps";
  if (unit === "meters") return `${v.reps}m`;
  if (unit === "calories") return `${v.reps} cal`;
  if (unit === "feet") return `${v.reps} ft`;
  if (unit === "sets") return `${v.reps} ${v.reps === 1 ? "set" : "sets"}`;
  return `${v.reps} ${v.reps === 1 ? "Rep" : "Reps"}`;
}

function variantLoadLabel(v: RxVariant): string | null {
  if (v.load_label?.trim()) return v.load_label.trim();
  if (v.weight_lb != null) return `${v.weight_lb} lb`;
  return null;
}

/** CrossFit-style dual: "20/14 lb" from "20 lb" + "14 lb". */
function tryCompactDual(a: string, b: string): string | null {
  const ma = a.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  const mb = b.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  if (ma && mb && ma[2].trim().toLowerCase() === mb[2].trim().toLowerCase()) {
    return `${ma[1]}/${mb[1]} ${ma[2].trim()}`;
  }
  return null;
}

function dualPairLabel(male: string | null, female: string | null): string | null {
  if (!male && !female) return null;
  if (male && female && male !== female) {
    return tryCompactDual(male, female) ?? `${male}/${female}`;
  }
  return male ?? female ?? null;
}

/** Amount only: 15/12 cal, 400m — excludes load and height. */
export function formatDualAmountLabel(
  variants: RxVariants,
  fallbackUnit?: PrescriptionUnit | string | null,
): string | null {
  const m = variants.male;
  const f = variants.female;
  if (!m && !f) return null;

  const unit = m?.prescription_unit ?? f?.prescription_unit ?? fallbackUnit ?? "reps";
  const suffix = unitSuffix(unit);

  if (m?.reps != null && f?.reps != null && m.reps !== f.reps) {
    return `${m.reps}/${f.reps}${suffix}`;
  }

  const single = m ?? f;
  if (single?.reps != null) {
    return variantAmountLabel(single, fallbackUnit);
  }
  return null;
}

/** Load and height modifiers: 20/14 lb · 10/9 ft */
export function formatDualModifierLabel(variants: RxVariants): string | null {
  const m = variants.male;
  const f = variants.female;
  const load = dualPairLabel(
    m ? variantLoadLabel(m) : null,
    f ? variantLoadLabel(f) : null,
  );
  const height = dualPairLabel(
    m?.height_label?.trim() || null,
    f?.height_label?.trim() || null,
  );
  return [load, height].filter(Boolean).join(" · ") || null;
}

/** @deprecated Use formatDualAmountLabel + formatDualModifierLabel */
export function formatRxVariantsCompact(
  variants: RxVariants,
  fallbackUnit?: PrescriptionUnit | string | null,
): string | null {
  const amount = formatDualAmountLabel(variants, fallbackUnit);
  const mods = formatDualModifierLabel(variants);
  if (amount && mods) return `${amount} · ${mods}`;
  return amount ?? mods;
}

export type ResolvedPrescription = {
  reps_prescribed: number | null;
  prescription_unit: PrescriptionUnit | string | null;
  prescribed_weight: number | null;
  /** Legacy modifier text; prefer load/height fields for display. */
  prescribed_score: string | null;
  /** When athlete gender unknown and amount differs, e.g. "15/12 cal" */
  dual_amount_label: string | null;
  /** When athlete gender unknown, e.g. "20/14 lb · 10/9 ft" */
  dual_modifier_label: string | null;
  load_label: string | null;
  height_label: string | null;
};

export type PrescriptionLineItem = {
  reps_prescribed?: number | null;
  prescription_unit?: PrescriptionUnit | string | null;
  prescribed_weight?: number | null;
  prescribed_score?: string | null;
  rx_variants?: unknown;
};

export function resolvePrescriptionForAthlete(
  item: PrescriptionLineItem,
  athleteGender: RxGender | null,
): ResolvedPrescription {
  const variants = parseRxVariants(item.rx_variants);
  const base: ResolvedPrescription = {
    reps_prescribed: item.reps_prescribed ?? null,
    prescription_unit: item.prescription_unit ?? "reps",
    prescribed_weight: item.prescribed_weight ?? null,
    prescribed_score: item.prescribed_score ?? null,
    dual_amount_label: null,
    dual_modifier_label: null,
    load_label: null,
    height_label: null,
  };

  if (!hasRxVariants(variants)) return base;

  const dualAmount = formatDualAmountLabel(variants, item.prescription_unit);
  const dualModifier = formatDualModifierLabel(variants);

  if (!athleteGender) {
    const repsDiffer =
      variants.male?.reps != null &&
      variants.female?.reps != null &&
      variants.male.reps !== variants.female.reps;
    return {
      ...base,
      reps_prescribed: repsDiffer
        ? null
        : (variants.male?.reps ?? variants.female?.reps ?? base.reps_prescribed),
      prescription_unit:
        variants.male?.prescription_unit ??
        variants.female?.prescription_unit ??
        base.prescription_unit,
      prescribed_weight: null,
      prescribed_score: null,
      dual_amount_label: repsDiffer ? dualAmount : null,
      dual_modifier_label: dualModifier,
      load_label: null,
      height_label: null,
    };
  }

  const v = athleteGender === "male" ? variants.male : variants.female;
  if (!v) {
    return {
      ...base,
      dual_amount_label: dualAmount,
      dual_modifier_label: dualModifier,
      prescribed_score: null,
    };
  }

  return {
    reps_prescribed: v.reps ?? base.reps_prescribed,
    prescription_unit: v.prescription_unit ?? base.prescription_unit,
    prescribed_weight: v.weight_lb ?? base.prescribed_weight,
    prescribed_score: null,
    dual_amount_label: null,
    dual_modifier_label: null,
    load_label: variantLoadLabel(v),
    height_label: v.height_label?.trim() ? v.height_label.trim() : null,
  };
}

/** Mirror primary legacy columns from variants (modifiers only in prescribed_score). */
export function syncLegacyFieldsFromVariants(
  item: PrescriptionLineItem & { rx_variants?: RxVariants },
): Pick<
  PrescriptionLineItem,
  "reps_prescribed" | "prescription_unit" | "prescribed_weight" | "prescribed_score"
> {
  const variants = parseRxVariants(item.rx_variants);
  if (!hasRxVariants(variants)) {
    return {
      reps_prescribed: item.reps_prescribed ?? null,
      prescription_unit: item.prescription_unit ?? null,
      prescribed_weight: item.prescribed_weight ?? null,
      prescribed_score: item.prescribed_score ?? null,
    };
  }

  const primary = variants.male ?? variants.female;
  const modifiers = formatDualModifierLabel(variants);

  return {
    reps_prescribed: primary?.reps ?? item.reps_prescribed ?? null,
    prescription_unit:
      primary?.prescription_unit ?? variants.male?.prescription_unit ?? item.prescription_unit ?? null,
    prescribed_weight: primary?.weight_lb ?? item.prescribed_weight ?? null,
    prescribed_score: modifiers ?? item.prescribed_score ?? null,
  };
}

export function rxVariantsForSave(
  variants: RxVariants | undefined | null,
): RxVariants {
  if (!variants || !hasRxVariants(variants)) return emptyRxVariants();
  const male = variants.male && variantHasData(variants.male) ? variants.male : undefined;
  const female =
    variants.female && variantHasData(variants.female) ? variants.female : undefined;
  if (!male && !female) return emptyRxVariants();
  return { ...(male ? { male } : {}), ...(female ? { female } : {}) };
}

/** Rx suffix parts for display (amount + load + height, no duplicates). */
export function formatResolvedRxParts(resolved: ResolvedPrescription): string[] {
  const parts: string[] = [];

  if (resolved.dual_amount_label?.trim()) {
    parts.push(resolved.dual_amount_label.trim());
  } else if (resolved.reps_prescribed != null) {
    const amount = formatPrescriptionAmount(
      resolved.reps_prescribed,
      resolved.prescription_unit ?? "reps",
    );
    if (amount) parts.push(amount);
  }

  if (resolved.dual_modifier_label?.trim()) {
    parts.push(resolved.dual_modifier_label.trim());
  } else {
    if (resolved.load_label?.trim()) parts.push(resolved.load_label.trim());
    if (resolved.height_label?.trim()) parts.push(resolved.height_label.trim());
  }

  return parts;
}
