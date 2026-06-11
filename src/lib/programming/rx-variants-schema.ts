import { z } from "zod";
import { PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";

export const RX_GENDERS = ["male", "female"] as const;
export type RxGender = (typeof RX_GENDERS)[number];

const rxVariantSchema = z.object({
  reps: z.number().nullable().optional(),
  prescription_unit: z.enum(PRESCRIPTION_UNITS).optional(),
  weight_lb: z.number().nullable().optional(),
  /** Text load when not a single number (e.g. "30 lb wall ball"). */
  load_label: z.string().max(80).nullable().optional(),
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
    (v.load_label?.trim().length ?? 0) > 0
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

/** CrossFit-style dual notation: 15/12 cal, 30/20 lb */
export function formatRxVariantsCompact(
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

  if (m?.load_label?.trim() && f?.load_label?.trim() && m.load_label !== f.load_label) {
    return `${m.load_label.trim()}/${f.load_label.trim()}`;
  }

  if (m?.weight_lb != null && f?.weight_lb != null && m.weight_lb !== f.weight_lb) {
    return `${m.weight_lb}/${f.weight_lb} lb`;
  }

  const single = m ?? f;
  if (single?.reps != null) return `${single.reps}${suffix}`;
  if (single?.load_label?.trim()) return single.load_label.trim();
  if (single?.weight_lb != null) return `${single.weight_lb} lb`;
  return null;
}

export type ResolvedPrescription = {
  reps_prescribed: number | null;
  prescription_unit: PrescriptionUnit | string | null;
  prescribed_weight: number | null;
  prescribed_score: string | null;
  /** When athlete gender unknown, e.g. "15/12 cal" */
  dual_amount_label: string | null;
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
  };

  if (!hasRxVariants(variants)) return base;

  const dual = formatRxVariantsCompact(variants, item.prescription_unit);

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
      prescribed_weight: null,
      prescribed_score:
        dual ??
        variants.male?.load_label ??
        variants.female?.load_label ??
        base.prescribed_score,
      dual_amount_label: repsDiffer ? dual : null,
    };
  }

  const v = athleteGender === "male" ? variants.male : variants.female;
  if (!v) return { ...base, dual_amount_label: dual };

  return {
    reps_prescribed: v.reps ?? base.reps_prescribed,
    prescription_unit: v.prescription_unit ?? base.prescription_unit,
    prescribed_weight: v.weight_lb ?? base.prescribed_weight,
    prescribed_score: v.load_label?.trim() ? v.load_label.trim() : base.prescribed_score,
    dual_amount_label: null,
  };
}

/** Mirror primary legacy columns from male (or female) variant for reporting. */
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
  const dual = formatRxVariantsCompact(variants, item.prescription_unit);

  return {
    reps_prescribed: primary?.reps ?? item.reps_prescribed ?? null,
    prescription_unit:
      primary?.prescription_unit ?? variants.male?.prescription_unit ?? item.prescription_unit ?? null,
    prescribed_weight: primary?.weight_lb ?? item.prescribed_weight ?? null,
    prescribed_score:
      dual ??
      primary?.load_label ??
      item.prescribed_score ??
      null,
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
