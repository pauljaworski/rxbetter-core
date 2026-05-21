import { useCallback, useState } from "react";
import { parseWodText } from "@/lib/wod-parser/parse-wod-text";
import type { BenchmarkCatalogEntry } from "@/lib/wod-parser/types";
import type { IntakeDraftPayload } from "./types";

export function useWodParser(
  catalog: BenchmarkCatalogEntry[],
  defaultLibraryId: string | null,
  displayOrder = 0,
) {
  const [draft, setDraft] = useState<IntakeDraftPayload | null>(null);
  const [needsLlmFallback, setNeedsLlmFallback] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState(0);
  const [rawText, setRawText] = useState("");

  const parse = useCallback(
    (text: string) => {
      setRawText(text);
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

  const reset = useCallback(() => {
    setDraft(null);
    setRawText("");
    setNeedsLlmFallback(false);
    setLastLatencyMs(0);
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
    parse,
    reset,
    updateDraft,
  };
}
