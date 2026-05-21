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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WOD_AI_PARSE_ENABLED } from "@/lib/wod-parser/feature-flags";
import { Sparkles, ChevronDown, Check, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  date: Date;
  defaultLib: string | null;
  displayOrder: number;
  onCommitted: () => void;
};

export function WodIntakePanel({ date, defaultLib, displayOrder, onCommitted }: Props) {
  const { activeGymId, contactId } = useAuth();
  const [open, setOpen] = useState(true);
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
          ? "Complex WOD — edit the draft below or add line items in the manual editor."
          : "Could not parse. Try a line like: Back Squat 5x3 @ 80%",
      );
      return;
    }
    if (result.needsLlmFallback) {
      toast.message("Metcon detected — review the draft and add movements below or in the manual editor.");
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card overflow-hidden p-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-4 py-3 text-left hover:bg-secondary/40"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-bold">Quick intake</p>
                <p className="text-[11px] text-muted-foreground">
                  Paste plain text · verify chips · save to {format(date, "MMM d")}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-4">
          <Textarea
            placeholder={'e.g. Back Squat 5x3 @ 80%\nOr: Deadlift 3 @ 225'}
            value={parser.rawText}
            onChange={(e) => parser.setRawText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void handleParse();
              }
            }}
            rows={3}
            className="font-mono text-sm"
            disabled={catalogLoading || !defaultLib}
          />
          <p className="text-[10px] text-muted-foreground">
            Ctrl+Enter to parse. Sets×reps (e.g. 5x3 @ 80%) → reps per set in the score field.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void handleParse()}
              disabled={catalogLoading || !defaultLib || parser.aiParsing}
            >
              Parse
            </Button>
            {WOD_AI_PARSE_ENABLED && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleParseWithAi()}
                disabled={
                  catalogLoading || !defaultLib || !parser.rawText.trim() || parser.aiParsing
                }
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {parser.aiParsing ? "Parsing…" : "Parse with AI"}
              </Button>
            )}
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
          {parser.aiError && (
            <p className="text-xs text-destructive">{parser.aiError}</p>
          )}
          {parser.needsLlmFallback && !parser.draft?.lineItems.length && !parser.usedAi && (
            <p className="text-xs text-amber-600">
              Regex could not fully structure this WOD. Edit below or use the manual editor.
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
