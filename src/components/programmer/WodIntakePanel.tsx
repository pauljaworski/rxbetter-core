import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useBenchmarkCatalog } from "@/hooks/staff/useBenchmarkCatalog";
import { useWodParser } from "@/hooks/staff/useWodParser";
import { useIntakeCommit } from "@/hooks/staff/useIntakeCommit";
import { useIntakeStageList } from "@/hooks/staff/useIntakeStageList";
import type { IntakeDraftPayload } from "@/hooks/staff/types";
import { WodIntakeDraft } from "./WodIntakeDraft";
import { IntakeStageTable } from "./IntakeStageTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WOD_AI_PARSE_ENABLED } from "@/lib/wod-parser/feature-flags";
import { Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  date: Date;
  defaultLib: string | null;
  displayOrder: number;
  onCommitted: () => void;
};

export function WodIntakePanel({ date, defaultLib, displayOrder, onCommitted }: Props) {
  const { activeGymId, contactId } = useAuth();
  const { data: catalog, isLoading: catalogLoading } = useBenchmarkCatalog();
  const catalogEntries = useMemo(
    () => catalog.map((c) => ({ id: c.id, name: c.name, stimulus: c.stimulus })),
    [catalog],
  );

  const draftEditedRef = useRef(false);
  const parser = useWodParser(catalogEntries, defaultLib, displayOrder);
  const { commitIntake, rejectIntake, busy } = useIntakeCommit(
    activeGymId,
    contactId,
    date,
    defaultLib,
  );
  const {
    data: stageRows,
    isLoading: stagesLoading,
    refetch: refetchStages,
  } = useIntakeStageList(activeGymId, date);

  async function handleParse() {
    if (!parser.rawText.trim()) {
      toast.error("Enter workout text first.");
      return;
    }
    const result = parser.parse(parser.rawText);
    draftEditedRef.current = false;
    if (!result.draft) {
      toast.message(
        result.needsLlmFallback
          ? "Complex WOD — try Parse with AI, or edit the draft below."
          : "Could not parse. Try: Back Squat 5x3 @ 80%",
      );
      return;
    }
    if (result.needsLlmFallback && WOD_AI_PARSE_ENABLED) {
      toast.message("Partial parse — Parse with AI will structure movements better.");
    }
  }

  async function handleParseWithAi() {
    if (!parser.rawText.trim()) {
      toast.error("Enter workout text first.");
      return;
    }
    if (!activeGymId || !defaultLib) {
      toast.error("Select a gym and program library.");
      return;
    }
    const { error, draft } = await parser.parseWithAi(parser.rawText, {
      gymId: activeGymId,
      programLibraryId: defaultLib,
      wodDate: date,
    });
    draftEditedRef.current = false;
    if (error) {
      toast.error("AI parse failed", { description: error });
      return;
    }
    if (draft) {
      toast.success("AI structured workout", {
        description: parser.modelUsed
          ? `${parser.modelUsed} · ${parser.tokenCount ?? "?"} tokens`
          : undefined,
      });
    }
  }

  async function handleCommit() {
    if (!parser.draft) return;
    const { error, programmingId } = await commitIntake({
      rawText: parser.rawText,
      draft: parser.draft,
      parserMode: parser.usedAi ? "llm" : "regex",
      latencyMs: parser.lastLatencyMs,
      tokenCount: parser.tokenCount,
      containsErrors: parser.draft.warnings.length > 0,
      correctionApplied: parser.usedAi && draftEditedRef.current,
      displayOrder,
    });
    if (error) {
      toast.error("Could not save", { description: error });
      return;
    }
    toast.success("Saved to calendar", { description: programmingId ?? undefined });
    parser.reset();
    refetchStages();
    onCommitted();
  }

  async function handleReject() {
    if (!parser.draft && !parser.rawText.trim()) {
      parser.reset();
      return;
    }
    const draft: IntakeDraftPayload =
      parser.draft ?? {
        segment: {
          name: "Rejected",
          description: parser.rawText,
          programming_segment: "weightlifting",
          metcon_format: null,
          athlete_notes: null,
          coaches_notes: null,
          display_order: displayOrder,
          program_library_id: defaultLib,
          program_library_ids: defaultLib ? [defaultLib] : [],
          items: [],
        },
        lineItems: [],
        warnings: [],
      };

    const { error } = await rejectIntake({
      rawText: parser.rawText || "(empty)",
      draft,
      parserMode: "manual",
      latencyMs: 0,
      containsErrors: true,
      correctionApplied: false,
    });
    if (error) toast.error("Could not log rejection", { description: error });
    else {
      toast.success("Intake discarded");
      parser.reset();
      refetchStages();
    }
  }

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-bold">Paste one workout</p>
          <p className="text-[11px] text-muted-foreground">
            One text block → one segment on {format(date, "EEE, MMM d")}. AI structures metcons and
            messy strength blocks; review chips, then save.
          </p>
        </div>
      </div>

      <Textarea
        placeholder={
          "Back Squat 5x3 @ 80%\n\nor\n\nAMRAP 12:\n10 thrusters 95/65\n10 pull-ups"
        }
        value={parser.rawText}
        onChange={(e) => parser.setRawText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (WOD_AI_PARSE_ENABLED) void handleParseWithAi();
            else void handleParse();
          }
        }}
        rows={6}
        className="font-mono text-sm"
        disabled={catalogLoading || !defaultLib}
      />
      <p className="text-[10px] text-muted-foreground">
        Ctrl+Enter to {WOD_AI_PARSE_ENABLED ? "Parse with AI" : "Parse"}. Strength:{" "}
        <span className="font-mono">5x3 @ 80%</span> → one set per line item.
      </p>
      <div className="flex flex-wrap gap-2">
        {WOD_AI_PARSE_ENABLED && (
          <Button
            size="sm"
            onClick={() => void handleParseWithAi()}
            disabled={catalogLoading || !defaultLib || !parser.rawText.trim() || parser.aiParsing}
            className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {parser.aiParsing ? "Parsing…" : "Parse with AI"}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void handleParse()}
          disabled={catalogLoading || !defaultLib || parser.aiParsing}
        >
          Parse (fast)
        </Button>
        {parser.draft && (
          <>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => void handleCommit()}
              disabled={busy}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Save to calendar
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleReject()} disabled={busy}>
              <X className="mr-1 h-3.5 w-3.5" /> Discard
            </Button>
          </>
        )}
      </div>
      {parser.aiError && <p className="text-xs text-destructive">{parser.aiError}</p>}
      {parser.needsLlmFallback && !parser.draft?.lineItems.length && !parser.usedAi && (
        <p className="text-xs text-amber-600">
          Fast parse couldn&apos;t fully structure this. Use Parse with AI or edit below.
        </p>
      )}
      {parser.draft && (
        <WodIntakeDraft
          draft={parser.draft}
          catalog={catalog}
          onChange={(d) => {
            draftEditedRef.current = true;
            parser.updateDraft(d);
          }}
        />
      )}
      <IntakeStageTable rows={stageRows} isLoading={stagesLoading} />
    </Card>
  );
}
