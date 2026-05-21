import { useCallback, useState } from "react";
import { format } from "date-fns";
import { formatFunctionsInvokeError } from "@/lib/functions-error";
import { supabase } from "@/lib/supabase";
import { parseWodText } from "@/lib/wod-parser/parse-wod-text";
import type { BenchmarkCatalogEntry } from "@/lib/wod-parser/types";
import type { IntakeDraftPayload } from "./types";

export type ParseWithAiParams = {
  gymId: string;
  programLibraryId: string;
  wodDate: Date;
};

type AiParseResponse = {
  draft: IntakeDraftPayload;
  needsLlmFallback?: boolean;
  latency_ms: number;
  token_count: number;
  model?: string;
  parser_tier?: string;
  error?: string;
};

export function useWodParser(
  catalog: BenchmarkCatalogEntry[],
  defaultLibraryId: string | null,
  displayOrder = 0,
) {
  const [draft, setDraft] = useState<IntakeDraftPayload | null>(null);
  const [needsLlmFallback, setNeedsLlmFallback] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState(0);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  const parse = useCallback(
    (text: string) => {
      setRawText(text);
      setUsedAi(false);
      setTokenCount(null);
      setModelUsed(null);
      setAiError(null);
      const result = parseWodText({
        rawText: text,
        catalog,
        defaultLibraryId,
        displayOrder,
      });
      setLastLatencyMs(result.latencyMs);
      setNeedsLlmFallback(result.needsLlmFallback);
      setDraft(result.draft);
      return result;
    },
    [catalog, defaultLibraryId, displayOrder],
  );

  const parseWithAi = useCallback(
    async (text: string, params: ParseWithAiParams) => {
      setRawText(text);
      setAiParsing(true);
      setAiError(null);

      const { data, error } = await supabase.functions.invoke("parse-complex-wod", {
        body: {
          gym_id: params.gymId,
          program_library_id: params.programLibraryId,
          raw_text: text,
          display_order: displayOrder,
          wod_date: format(params.wodDate, "yyyy-MM-dd"),
        },
      });

      setAiParsing(false);

      if (error) {
        const msg = await formatFunctionsInvokeError(error);
        setAiError(msg);
        return { error: msg, draft: null as IntakeDraftPayload | null };
      }

      const payload = data as AiParseResponse;
      if (payload?.error) {
        setAiError(payload.error);
        return { error: payload.error, draft: null };
      }

      if (!payload?.draft) {
        setAiError("AI returned no draft");
        return { error: "AI returned no draft", draft: null };
      }

      setDraft(payload.draft);
      setNeedsLlmFallback(false);
      setUsedAi(true);
      setLastLatencyMs(payload.latency_ms ?? 0);
      setTokenCount(payload.token_count ?? null);
      setModelUsed(payload.model ?? null);

      return { error: null, draft: payload.draft };
    },
    [displayOrder],
  );

  const reset = useCallback(() => {
    setDraft(null);
    setRawText("");
    setNeedsLlmFallback(false);
    setLastLatencyMs(0);
    setTokenCount(null);
    setModelUsed(null);
    setUsedAi(false);
    setAiError(null);
  }, []);

  const updateDraft = useCallback((next: IntakeDraftPayload) => {
    setDraft(next);
  }, []);

  return {
    draft,
    rawText,
    setRawText,
    needsLlmFallback,
    lastLatencyMs,
    tokenCount,
    modelUsed,
    usedAi,
    aiParsing,
    aiError,
    parse,
    parseWithAi,
    reset,
    updateDraft,
  };
}
