import { format } from "date-fns";
import { formatFunctionsInvokeError } from "@/lib/functions-error";
import { supabase } from "@/lib/supabase";
import { parseWodText } from "@/lib/wod-parser/parse-wod-text";
import type { BenchmarkCatalogEntry } from "@/lib/wod-parser/types";
import type { IntakeDraftPayload } from "@/hooks/staff/types";

export type ParsedIntakeBlock = {
  draft: IntakeDraftPayload | null;
  needsLlmFallback: boolean;
  latencyMs: number;
  usedAi: boolean;
  tokenCount: number | null;
  model: string | null;
  error: string | null;
};

/** Local regex parse for one text block. */
export function parseIntakeBlockLocal(input: {
  rawText: string;
  catalog: BenchmarkCatalogEntry[];
  defaultLibraryId: string | null;
  displayOrder: number;
}): ParsedIntakeBlock {
  const result = parseWodText({
    rawText: input.rawText,
    catalog: input.catalog,
    defaultLibraryId: input.defaultLibraryId,
    displayOrder: input.displayOrder,
  });
  return {
    draft: result.draft,
    needsLlmFallback: result.needsLlmFallback,
    latencyMs: result.latencyMs,
    usedAi: false,
    tokenCount: null,
    model: null,
    error: null,
  };
}

/** OpenRouter AI parse for one text block (edge function). */
export async function parseIntakeBlockWithAi(input: {
  rawText: string;
  gymId: string;
  programLibraryId: string;
  wodDate: Date | string;
  displayOrder: number;
}): Promise<ParsedIntakeBlock> {
  const wodDate =
    typeof input.wodDate === "string" ? input.wodDate : format(input.wodDate, "yyyy-MM-dd");

  const { data, error } = await supabase.functions.invoke("parse-complex-wod", {
    body: {
      gym_id: input.gymId,
      program_library_id: input.programLibraryId,
      raw_text: input.rawText,
      display_order: input.displayOrder,
      wod_date: wodDate,
    },
  });

  if (error) {
    const msg = await formatFunctionsInvokeError(error);
    return {
      draft: null,
      needsLlmFallback: true,
      latencyMs: 0,
      usedAi: false,
      tokenCount: null,
      model: null,
      error: msg,
    };
  }

  const payload = data as {
    draft?: IntakeDraftPayload;
    latency_ms?: number;
    token_count?: number;
    model?: string;
    error?: string;
  };

  if (payload?.error || !payload?.draft) {
    return {
      draft: null,
      needsLlmFallback: true,
      latencyMs: 0,
      usedAi: false,
      tokenCount: null,
      model: null,
      error: payload?.error ?? "AI returned no draft",
    };
  }

  return {
    draft: payload.draft,
    needsLlmFallback: false,
    latencyMs: payload.latency_ms ?? 0,
    usedAi: true,
    tokenCount: payload.token_count ?? null,
    model: payload.model ?? null,
    error: null,
  };
}
