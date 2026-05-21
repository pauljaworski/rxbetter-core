import { z } from "npm:zod@3.25.76";

export const PROGRAMMING_SEGMENTS = [
  "weightlifting",
  "metcon",
  "skill",
  "bodyweight",
] as const;

export const METCON_FORMATS = ["amrap", "chipper", "emom", "for_time"] as const;

export function normalizeProgrammingSegment(seg: string): (typeof PROGRAMMING_SEGMENTS)[number] {
  const s = seg.toLowerCase().trim();
  if (s === "strength") return "weightlifting";
  if ((PROGRAMMING_SEGMENTS as readonly string[]).includes(s)) {
    return s as (typeof PROGRAMMING_SEGMENTS)[number];
  }
  return "weightlifting";
}

export function normalizeMetconFormat(
  fmt: string | null | undefined,
): (typeof METCON_FORMATS)[number] | null {
  if (!fmt) return null;
  const f = fmt.toLowerCase().trim();
  if (f === "rft" || f === "tabata") return "for_time";
  if ((METCON_FORMATS as readonly string[]).includes(f)) {
    return f as (typeof METCON_FORMATS)[number];
  }
  return null;
}

export const llmIntakeDraftSchema = z.object({
  segment: z.object({
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    programming_segment: z.string(),
    metcon_format: z.string().nullable().optional(),
    athlete_notes: z.string().nullable().optional(),
    coaches_notes: z.string().nullable().optional(),
  }),
  movements: z
    .array(
      z.object({
        name: z.string().min(1),
        sequence_number: z.number().int().positive().optional(),
        reps_prescribed: z.number().nullable().optional(),
        prescribed_weight: z.number().nullable().optional(),
        prescribed_percentage: z.number().nullable().optional(),
        prescribed_score: z.string().nullable().optional(),
      }),
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
});

export type LlmIntakeDraft = z.infer<typeof llmIntakeDraftSchema>;

export type IntakeDraftPayload = {
  segment: {
    name: string | null;
    description: string | null;
    programming_segment: (typeof PROGRAMMING_SEGMENTS)[number];
    metcon_format: (typeof METCON_FORMATS)[number] | null;
    athlete_notes: string | null;
    coaches_notes: string | null;
    display_order: number;
    program_library_id: string | null;
    items: [];
  };
  lineItems: {
    sequence_number: number;
    reps_prescribed: number | null;
    prescribed_weight: number | null;
    prescribed_percentage: number | null;
    prescribed_score: string | null;
    benchmark_type_id: string | null;
    bench_name?: string;
  }[];
  warnings: string[];
  unmatchedTokens?: string[];
  _meta?: { model?: string; token_count?: number; parser_tier?: string };
};
