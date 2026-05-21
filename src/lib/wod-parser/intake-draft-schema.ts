import { z } from "zod";

export const PROGRAMMING_SEGMENTS = [
  "weightlifting",
  "metcon",
  "skill",
  "bodyweight",
] as const;

export const METCON_FORMATS = ["amrap", "chipper", "emom", "for_time"] as const;

export type ProgrammingSegment = (typeof PROGRAMMING_SEGMENTS)[number];
export type MetconFormat = (typeof METCON_FORMATS)[number];

/** Map legacy/parser aliases to DB-safe values. */
export function normalizeProgrammingSegment(seg: string): ProgrammingSegment {
  const s = seg.toLowerCase().trim();
  if (s === "strength") return "weightlifting";
  if ((PROGRAMMING_SEGMENTS as readonly string[]).includes(s)) return s as ProgrammingSegment;
  return "weightlifting";
}

export function normalizeMetconFormat(fmt: string | null | undefined): MetconFormat | null {
  if (!fmt) return null;
  const f = fmt.toLowerCase().trim();
  if (f === "rft" || f === "tabata") return "for_time";
  if ((METCON_FORMATS as readonly string[]).includes(f)) return f as MetconFormat;
  return null;
}

export const llmMovementSchema = z.object({
  name: z.string().min(1),
  sequence_number: z.number().int().positive().optional(),
  reps_prescribed: z.number().nullable().optional(),
  prescribed_weight: z.number().nullable().optional(),
  prescribed_percentage: z.number().min(0).max(1).nullable().optional(),
  prescribed_score: z.string().nullable().optional(),
});

export const llmSegmentSchema = z.object({
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  programming_segment: z.string(),
  metcon_format: z.string().nullable().optional(),
  athlete_notes: z.string().nullable().optional(),
  coaches_notes: z.string().nullable().optional(),
});

export const llmIntakeDraftSchema = z.object({
  segment: llmSegmentSchema,
  movements: z.array(llmMovementSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type LlmIntakeDraft = z.infer<typeof llmIntakeDraftSchema>;

export const intakeDraftMetaSchema = z
  .object({
    model: z.string().optional(),
    token_count: z.number().int().optional(),
    parser_tier: z.string().optional(),
  })
  .optional();

export const intakeDraftPayloadSchema = z.object({
  segment: z.object({
    name: z.string().nullable(),
    description: z.string().nullable(),
    programming_segment: z.enum(PROGRAMMING_SEGMENTS),
    metcon_format: z.enum(METCON_FORMATS).nullable(),
    athlete_notes: z.string().nullable(),
    coaches_notes: z.string().nullable(),
    display_order: z.number(),
    program_library_id: z.string().nullable(),
    program_library_ids: z.array(z.string()).optional(),
  }),
  lineItems: z.array(
    z.object({
      sequence_number: z.number(),
      reps_prescribed: z.number().nullable(),
      prescribed_weight: z.number().nullable(),
      prescribed_percentage: z.number().nullable(),
      prescribed_score: z.string().nullable(),
      benchmark_type_id: z.string().nullable(),
      bench_name: z.string().optional(),
    }),
  ),
  warnings: z.array(z.string()),
  unmatchedTokens: z.array(z.string()).optional(),
  _meta: intakeDraftMetaSchema,
});
