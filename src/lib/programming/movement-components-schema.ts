import { z } from "zod";
import { formatRestDuration } from "@/lib/programming/gym-benchmark-type";
import { PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";

export const movementComponentSchema = z.object({
  benchmark_type_id: z.string().uuid().nullable(),
  /** Amount (reps, meters, calories, feet, or seconds depending on unit). */
  reps: z.number().int().min(1).max(99999),
  unit: z.enum(PRESCRIPTION_UNITS).default("reps"),
  label: z.string().min(1).max(120),
  /** Optional rest after this movement within a multi-move set (seconds). */
  rest_after_sec: z.number().int().min(0).max(7200).nullable().optional(),
});

export const movementComponentsSchema = z.array(movementComponentSchema).max(12);

export type MovementComponent = z.infer<typeof movementComponentSchema>;

function coerceComponent(raw: unknown): MovementComponent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!label) return null;
  const reps =
    typeof o.reps === "number"
      ? o.reps
      : typeof o.amount === "number"
        ? o.amount
        : Number(o.reps);
  if (!Number.isFinite(reps) || reps < 1) return null;
  const unitRaw = typeof o.unit === "string" ? o.unit : "reps";
  const unit = (PRESCRIPTION_UNITS as readonly string[]).includes(unitRaw)
    ? (unitRaw as PrescriptionUnit)
    : "reps";
  const rest =
    o.rest_after_sec == null || o.rest_after_sec === ""
      ? null
      : Number(o.rest_after_sec);
  return {
    benchmark_type_id:
      typeof o.benchmark_type_id === "string" && o.benchmark_type_id.length > 0
        ? o.benchmark_type_id
        : null,
    reps: Math.min(99999, Math.max(1, Math.round(reps))),
    unit,
    label: label.slice(0, 120),
    rest_after_sec:
      rest != null && Number.isFinite(rest) ? Math.min(7200, Math.max(0, Math.round(rest))) : null,
  };
}

export function parseMovementComponents(raw: unknown): MovementComponent[] {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: MovementComponent[] = [];
  for (const elem of raw) {
    const c = coerceComponent(elem);
    if (c) out.push(c);
    if (out.length >= 12) break;
  }
  return out;
}

function formatComponentAmount(c: MovementComponent): string {
  const unit = c.unit ?? "reps";
  switch (unit) {
    case "feet":
      return `${c.reps}' ${c.label}`;
    case "meters":
      return `${c.reps}m ${c.label}`;
    case "calories":
      return `${c.reps} cal ${c.label}`;
    case "seconds": {
      const t = formatRestDuration(c.reps) ?? `${c.reps}s`;
      return `${t} ${c.label}`;
    }
    default:
      return `${c.reps} ${c.label}`;
  }
}

export type FormatComplexOptions = {
  restBetweenSetsSec?: number | null;
};

/**
 * Olympic complex: "2 Clean Pull + 1 Power Clean"
 * Strength circuit / mixed units: "8 BSS/leg, 12 DB RDL, 60' Farmer Carry, Rest 1:30"
 */
export function formatComplexMovementTitle(
  components: MovementComponent[],
  opts?: FormatComplexOptions,
): string {
  if (!components.length) return "Complex";
  const useList = components.some(
    (c) =>
      (c.unit ?? "reps") !== "reps" || (c.rest_after_sec != null && c.rest_after_sec > 0),
  );
  const parts: string[] = [];
  for (const c of components) {
    parts.push(formatComponentAmount(c));
    const rest = formatRestDuration(c.rest_after_sec);
    if (rest) parts.push(`Rest ${rest}`);
  }
  let title = useList ? parts.join(", ") : parts.join(" + ");
  const between = formatRestDuration(opts?.restBetweenSetsSec);
  if (between) title = `${title}, Rest ${between}`;
  return title;
}

export function movementComponentsForSave(
  kind: string,
  components: MovementComponent[] | undefined | null,
): MovementComponent[] {
  if (kind !== "complex_set") return [];
  return (components ?? []).map((c) => ({
    benchmark_type_id: c.benchmark_type_id,
    reps: c.reps,
    unit: c.unit ?? "reps",
    label: c.label,
    rest_after_sec: c.rest_after_sec ?? null,
  }));
}
