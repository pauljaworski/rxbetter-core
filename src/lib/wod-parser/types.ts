import type { IntakeDraftPayload } from "@/hooks/staff/types";

export type BenchmarkCatalogEntry = { id: string; name: string; stimulus: string | null };

export type ParseWodOptions = {
  rawText: string;
  catalog: BenchmarkCatalogEntry[];
  defaultLibraryId: string | null;
  displayOrder?: number;
};

export type ParseWodResult = {
  draft: IntakeDraftPayload | null;
  needsLlmFallback: boolean;
  latencyMs: number;
};
