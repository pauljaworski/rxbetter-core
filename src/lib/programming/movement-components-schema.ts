import { z } from "zod";

export const movementComponentSchema = z.object({
  benchmark_type_id: z.string().uuid().nullable(),
  reps: z.number().int().min(1).max(99),
  label: z.string().min(1).max(120),
});

export const movementComponentsSchema = z.array(movementComponentSchema).max(8);

export type MovementComponent = z.infer<typeof movementComponentSchema>;

export function parseMovementComponents(raw: unknown): MovementComponent[] {
  if (raw == null) return [];
  if (Array.isArray(raw) && raw.length === 0) return [];
  const parsed = movementComponentsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

/** e.g. "2 Clean Pull + 1 Power Clean" */
export function formatComplexMovementTitle(components: MovementComponent[]): string {
  if (!components.length) return "Complex";
  return components.map((c) => `${c.reps} ${c.label}`).join(" + ");
}

export function movementComponentsForSave(
  kind: string,
  components: MovementComponent[] | undefined | null,
): MovementComponent[] {
  if (kind !== "complex_set") return [];
  return components ?? [];
}
