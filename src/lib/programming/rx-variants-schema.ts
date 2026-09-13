import { z } from "zod";
import { formatPrescriptionAmount, PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";

export const RX_GENDERS = ["male", "female"] as const;
export type RxGender = (typeof RX_GENDERS)[number];

export const LOAD_MODALITIES = ["single", "double"] as const;
export type LoadModality = (typeof LOAD_MODALITIES)[number];

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
  /**
   * Shared implement count for DB/KB loads.
   * `double` → athlete sees 50s/35s (per hand); enter one DB/KB weight, not total.
   */
  load_modality: z.enum(LOAD_MODALITIES).nullable().optional(),
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
  if (v.load_label?.trim()) return ensureLoadUnit(v.load_label);
  if (v.weight_lb != null) return `${v.weight_lb} lb`;
  return null;
}

/** Strip default unit for editor display (programmer types "20", UI shows lbs). */
export function displayLoadAmount(label: string | null | undefined): string {
  if (!label?.trim()) return "";
  return label.trim().replace(/\s*lbs?\s*$/i, "").trim();
}

export function displayHeightAmount(label: string | null | undefined): string {
  if (!label?.trim()) return "";
  const t = label.trim();
  if (/^\d+(?:\.\d+)?'$/.test(t)) return t.slice(0, -1);
  return t.replace(/\s*(ft|feet)\s*$/i, "").trim();
}

/** Persist load with default lb unless another unit is already specified. */
export function ensureLoadUnit(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (/\b(lb|lbs|kg|#)\b/i.test(t)) {
    return t.replace(/\blbs\b/i, "lb");
  }
  if (/^\d+(?:\.\d+)?$/.test(t)) return `${t} lb`;
  return t;
}

/** Persist height with default ft unless ' or another unit is specified. */
export function ensureHeightUnit(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (/[''′]|(\bft\b|\bfeet\b)/i.test(t)) return t;
  if (/^\d+(?:\.\d+)?$/.test(t)) return `${t} ft`;
  return t;
}

/** CrossFit-style dual numbers: "115/75" from "115 lb" + "75 lb" (unit stripped for display). */
function tryCompactDualNumbers(a: string, b: string): string | null {
  const ma = a.match(/^(\d+(?:\.\d+)?)/);
  const mb = b.match(/^(\d+(?:\.\d+)?)/);
  if (ma && mb) {
    if (ma[1] === mb[1]) return ma[1];
    return `${ma[1]}/${mb[1]}`;
  }
  return null;
}

/** CrossFit-style dual: "20/14 lb" from "20 lb" + "14 lb" (kept for legacy prescribed_score). */
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

function dualLoadParen(
  male: string | null,
  female: string | null,
  modality?: LoadModality | null,
): string | null {
  const suffix = modality === "double" ? "s" : "";
  if (!male && !female) return null;
  if (male && female) {
    const compact = tryCompactDualNumbers(male, female);
    if (compact) {
      if (compact.includes("/")) {
        const [a, b] = compact.split("/");
        return `(${a}${suffix}/${b}${suffix})`;
      }
      return `(${compact}${suffix})`;
    }
  }
  const one = (male ?? female)!.match(/^(\d+(?:\.\d+)?)/);
  return one ? `(${one[1]}${suffix})` : wrapParens((male ?? female)!);
}

function dualHeightParen(male: string | null, female: string | null): string | null {
  const toFeet = (h: string): string => {
    const n = h.trim().match(/^(\d+(?:\.\d+)?)/);
    return n ? `${n[1]}'` : normalizeHeightDisplay(h);
  };
  if (!male && !female) return null;
  if (male && female) {
    const m = toFeet(male);
    const f = toFeet(female);
    return m === f ? `(${m})` : `(${m}/${f})`;
  }
  return `(${toFeet((male ?? female)!)})`;
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

/** Load and height modifiers for legacy storage: 20/14 lb · 10/9 ft */
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

/** Athlete-facing dual modifiers: (115/75) · (10'/9') or double DB/KB (50s/35s) */
export function formatDualModifierParens(variants: RxVariants): string[] {
  const m = variants.male;
  const f = variants.female;
  const out: string[] = [];
  const load = dualLoadParen(
    m ? variantLoadLabel(m) : null,
    f ? variantLoadLabel(f) : null,
    variants.load_modality,
  );
  const height = dualHeightParen(
    m?.height_label?.trim() ? ensureHeightUnit(m.height_label) : null,
    f?.height_label?.trim() ? ensureHeightUnit(f.height_label) : null,
  );
  if (load) out.push(load);
  if (height) out.push(height);
  return out;
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
  // Always show M/F load & height (e.g. (115/75) (10'/9')), even when gender filter is set.
  const dualModifierParens = formatDualModifierParens(variants);
  const dualModifierJoined = dualModifierParens.join(" · ") || null;

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
      dual_modifier_label: dualModifierJoined,
      load_label: null,
      height_label: null,
    };
  }

  const v = athleteGender === "male" ? variants.male : variants.female;
  if (!v) {
    return {
      ...base,
      dual_amount_label: dualAmount,
      dual_modifier_label: dualModifierJoined,
      prescribed_score: null,
    };
  }

  return {
    reps_prescribed: v.reps ?? base.reps_prescribed,
    prescription_unit: v.prescription_unit ?? base.prescription_unit,
    prescribed_weight: v.weight_lb ?? base.prescribed_weight,
    prescribed_score: null,
    dual_amount_label: null,
    dual_modifier_label: dualModifierJoined,
    load_label: null,
    height_label: null,
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
  if (!variants) return emptyRxVariants();
  if (!hasRxVariants(variants)) {
    return variants.load_modality ? { load_modality: variants.load_modality } : emptyRxVariants();
  }
  const male = variants.male && variantHasData(variants.male) ? variants.male : undefined;
  const female =
    variants.female && variantHasData(variants.female) ? variants.female : undefined;
  if (!male && !female) {
    return variants.load_modality ? { load_modality: variants.load_modality } : emptyRxVariants();
  }
  return {
    ...(variants.load_modality ? { load_modality: variants.load_modality } : {}),
    ...(male ? { male } : {}),
    ...(female ? { female } : {}),
  };
}

/** Rx suffix parts for display (amount + load + height, no duplicates). */
export function formatResolvedRxParts(resolved: ResolvedPrescription): string[] {
  const { amount, modifiers } = formatResolvedRxAmountAndModifiers(resolved);
  return [...(amount ? [amount] : []), ...modifiers];
}

/** Prefer feet as 10' for athlete-facing height text. */
export function normalizeHeightDisplay(label: string): string {
  const t = label.trim();
  const compact = t.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\s*(ft|feet|')?$/i);
  if (compact) return `${compact[1]}'/${compact[2]}'`;
  const single = t.match(/^(\d+(?:\.\d+)?)\s*(ft|feet|')?$/i);
  if (single) return `${single[1]}'`;
  return t;
}

/** Athlete-facing load: (115/75) or (115) — numbers only, no unit. */
export function normalizeLoadDisplay(label: string): string {
  const t = label.trim();
  if (t.startsWith("(") && t.endsWith(")")) return t.slice(1, -1);
  const dual = t.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/);
  if (dual) return `${dual[1]}/${dual[2]}`;
  const single = t.match(/^(\d+(?:\.\d+)?)/);
  if (single) return single[1];
  return t.replace(/\blbs?\b/gi, "").trim();
}

function wrapParens(label: string): string {
  const t = label.trim();
  if (!t) return t;
  if (t.startsWith("(") && t.endsWith(")")) return t;
  return `(${t})`;
}

/** Amount plus parenthesized load/height modifiers for titles. */
export function formatResolvedRxAmountAndModifiers(resolved: ResolvedPrescription): {
  amount: string | null;
  modifiers: string[];
} {
  let amount: string | null = null;
  if (resolved.dual_amount_label?.trim()) {
    amount = resolved.dual_amount_label.trim();
  } else if (resolved.reps_prescribed != null) {
    amount = formatPrescriptionAmount(
      resolved.reps_prescribed,
      resolved.prescription_unit ?? "reps",
    );
  }

  const modifiers: string[] = [];
  if (resolved.dual_modifier_label?.trim()) {
    for (const raw of resolved.dual_modifier_label.split(" · ")) {
      const piece = raw.trim();
      if (!piece) continue;
      // Already parenthesized from formatDualModifierParens
      if (piece.startsWith("(") && piece.endsWith(")")) {
        modifiers.push(piece);
        continue;
      }
      // Legacy "20/14 lb · 10/9 ft"
      if (/\bft\b|feet|'/i.test(piece)) {
        modifiers.push(wrapParens(normalizeHeightDisplay(piece)));
      } else {
        modifiers.push(wrapParens(normalizeLoadDisplay(piece)));
      }
    }
  } else {
    if (resolved.load_label?.trim()) {
      modifiers.push(wrapParens(normalizeLoadDisplay(resolved.load_label)));
    }
    if (resolved.height_label?.trim()) {
      modifiers.push(wrapParens(normalizeHeightDisplay(resolved.height_label)));
    }
  }

  return { amount, modifiers };
}
