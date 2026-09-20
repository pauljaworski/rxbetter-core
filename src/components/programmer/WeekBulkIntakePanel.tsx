import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBenchmarkCatalog } from "@/hooks/staff/useBenchmarkCatalog";
import { useIntakeCommit } from "@/hooks/staff/useIntakeCommit";
import type { IntakeDraftPayload } from "@/hooks/staff/types";
import { WodIntakeDraft } from "@/components/programmer/WodIntakeDraft";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { WOD_AI_PARSE_ENABLED } from "@/lib/wod-parser/feature-flags";
import {
  parseIntakeBlockLocal,
  parseIntakeBlockWithAi,
} from "@/lib/wod-parser/parse-intake-block";
import { splitWeekPasteIntoSegments } from "@/lib/wod-parser/split-week-paste";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type RowStatus = "pending" | "parsing" | "ready" | "error" | "saved";

type BulkRow = {
  id: string;
  dateKey: string;
  dayLabel: string;
  segmentIndex: number;
  rawText: string;
  include: boolean;
  status: RowStatus;
  draft: IntakeDraftPayload | null;
  usedAi: boolean;
  latencyMs: number;
  tokenCount: number | null;
  model: string | null;
  error: string | null;
  expanded: boolean;
};

type Props = {
  weekStart: Date;
  defaultLib: string | null;
  onCommitted: () => void;
};

async function countExistingForDate(gymId: string, dateKey: string): Promise<number> {
  const { count } = await supabase
    .from("programming")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .eq("wod_date", dateKey);
  return count ?? 0;
}

export function WeekBulkIntakePanel({ weekStart, defaultLib, onCommitted }: Props) {
  const { activeGymId, contactId } = useAuth();
  const { data: catalog, isLoading: catalogLoading } = useBenchmarkCatalog();
  const catalogEntries = useMemo(
    () => catalog.map((c) => ({ id: c.id, name: c.name, stimulus: c.stimulus })),
    [catalog],
  );
  const { commitIntake, busy } = useIntakeCommit(
    activeGymId,
    contactId,
    weekStart,
    defaultLib,
  );

  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [working, setWorking] = useState(false);

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function handleSplitAndParse() {
    if (!raw.trim()) {
      toast.error("Paste week programming text first.");
      return;
    }
    if (!activeGymId || !defaultLib) {
      toast.error("Select a gym and program library.");
      return;
    }

    const segments = splitWeekPasteIntoSegments(raw, weekStart);
    if (!segments.length) {
      toast.error("Couldn't find any day blocks", {
        description: "Start sections with Monday, Tue, 2026-09-15, etc.",
      });
      return;
    }

    const seeded: BulkRow[] = segments.map((s, i) => ({
      id: `${s.dateKey}-${s.segmentIndex}-${i}`,
      dateKey: s.dateKey,
      dayLabel: s.dayLabel,
      segmentIndex: s.segmentIndex,
      rawText: s.rawText,
      include: true,
      status: "pending",
      draft: null,
      usedAi: false,
      latencyMs: 0,
      tokenCount: null,
      model: null,
      error: null,
      expanded: false,
    }));
    setRows(seeded);
    setWorking(true);

    const orderByDate = new Map<string, number>();
    for (const dateKey of Array.from(new Set(seeded.map((r) => r.dateKey)))) {
      orderByDate.set(dateKey, await countExistingForDate(activeGymId, dateKey));
    }

    for (const row of seeded) {
      updateRow(row.id, { status: "parsing" });
      const displayOrder = orderByDate.get(row.dateKey) ?? 0;
      orderByDate.set(row.dateKey, displayOrder + 1);

      let parsed = parseIntakeBlockLocal({
        rawText: row.rawText,
        catalog: catalogEntries,
        defaultLibraryId: defaultLib,
        displayOrder,
      });

      const shouldAi =
        WOD_AI_PARSE_ENABLED &&
        (!parsed.draft ||
          parsed.needsLlmFallback ||
          (parsed.draft.lineItems.length === 0 &&
            /amrap|emom|for\s*time|rft|metcon|chipper/i.test(row.rawText)));

      if (shouldAi) {
        const ai = await parseIntakeBlockWithAi({
          rawText: row.rawText,
          gymId: activeGymId,
          programLibraryId: defaultLib,
          wodDate: row.dateKey,
          displayOrder,
        });
        if (ai.draft) parsed = ai;
        else if (!parsed.draft) parsed = { ...parsed, error: ai.error };
      }

      if (!parsed.draft) {
        updateRow(row.id, {
          status: "error",
          error: parsed.error ?? "Could not parse this block",
          draft: null,
        });
        continue;
      }

      // Stamp library + order on draft
      const draft: IntakeDraftPayload = {
        ...parsed.draft,
        segment: {
          ...parsed.draft.segment,
          display_order: displayOrder,
          program_library_id: defaultLib,
          program_library_ids: [defaultLib],
        },
      };

      updateRow(row.id, {
        status: "ready",
        draft,
        usedAi: parsed.usedAi,
        latencyMs: parsed.latencyMs,
        tokenCount: parsed.tokenCount,
        model: parsed.model,
        error: null,
        expanded: false,
      });
    }

    setWorking(false);
    toast.success(`Parsed ${seeded.length} segment${seeded.length === 1 ? "" : "s"}`, {
      description: "Review, uncheck any to skip, then save selected.",
    });
  }

  async function handleSaveSelected() {
    const selected = rows.filter((r) => r.include && r.draft && r.status === "ready");
    if (!selected.length) {
      toast.error("Nothing selected to save");
      return;
    }
    if (!activeGymId || !defaultLib) return;

    setWorking(true);
    let saved = 0;
    const orderByDate = new Map<string, number>();
    for (const dateKey of Array.from(new Set(selected.map((r) => r.dateKey)))) {
      orderByDate.set(dateKey, await countExistingForDate(activeGymId, dateKey));
    }

    for (const row of selected) {
      if (!row.draft) continue;
      const displayOrder = orderByDate.get(row.dateKey) ?? 0;
      orderByDate.set(row.dateKey, displayOrder + 1);

      const { error } = await commitIntake({
        rawText: row.rawText,
        draft: {
          ...row.draft,
          segment: { ...row.draft.segment, display_order: displayOrder },
        },
        parserMode: row.usedAi ? "llm" : "regex",
        latencyMs: row.latencyMs,
        tokenCount: row.tokenCount,
        containsErrors: (row.draft.warnings?.length ?? 0) > 0,
        correctionApplied: false,
        displayOrder,
        wodDate: row.dateKey,
      });

      if (error) {
        updateRow(row.id, { status: "error", error });
        toast.error(`Failed ${row.dayLabel}`, { description: error });
        continue;
      }
      updateRow(row.id, { status: "saved", include: false });
      saved += 1;
    }

    setWorking(false);
    if (saved > 0) {
      toast.success(`Saved ${saved} workout${saved === 1 ? "" : "s"} to the calendar`);
      onCommitted();
    }
  }

  const readyCount = rows.filter((r) => r.include && r.status === "ready").length;

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex items-start gap-2">
        <Upload className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-bold">Bulk week intake</p>
          <p className="text-[11px] text-muted-foreground">
            Paste several days at once. Label days with{" "}
            <span className="font-mono">Monday</span>,{" "}
            <span className="font-mono">Tue</span>, or{" "}
            <span className="font-mono">2026-09-15</span>. Separate segments with Strength / Metcon
            headers or <span className="font-mono">---</span>. Week of{" "}
            {format(weekStart, "MMM d")}.
          </p>
        </div>
      </div>

      <Textarea
        placeholder={`Monday\nBack Squat 5x3 @ 80%\n\nMetcon\nAMRAP 12:\n10 thrusters\n10 pull-ups\n\nTuesday\nDeadlift 3x5 @ 75%\n\n---\nFor time:\n21-15-9\nThrusters\nPull-ups`}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={10}
        className="font-mono text-sm"
        disabled={catalogLoading || !defaultLib || working}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => void handleSplitAndParse()}
          disabled={catalogLoading || !defaultLib || working || !raw.trim()}
          className="gap-1.5"
        >
          {working ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {working ? "Parsing…" : WOD_AI_PARSE_ENABLED ? "Split & parse (AI)" : "Split & parse"}
        </Button>
        {readyCount > 0 && (
          <Button
            size="sm"
            variant="default"
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={working || busy}
            onClick={() => void handleSaveSelected()}
          >
            <Check className="h-3.5 w-3.5" />
            Save {readyCount} selected
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "rounded-lg border border-border/60 bg-secondary/20 p-3",
                row.status === "saved" && "opacity-60",
                row.status === "error" && "border-destructive/40",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Checkbox
                  checked={row.include && row.status !== "saved"}
                  disabled={row.status !== "ready"}
                  onCheckedChange={(v) => updateRow(row.id, { include: !!v })}
                />
                <p className="text-sm font-semibold">
                  {row.dayLabel}
                  {row.segmentIndex > 0 ? ` · part ${row.segmentIndex + 1}` : ""}
                </p>
                <Badge variant="secondary" className="text-[10px]">
                  {row.status === "parsing"
                    ? "Parsing…"
                    : row.status === "ready"
                      ? row.usedAi
                        ? "AI ready"
                        : "Ready"
                      : row.status === "saved"
                        ? "Saved"
                        : row.status === "error"
                          ? "Error"
                          : "Pending"}
                </Badge>
                {row.draft?.segment.programming_segment && (
                  <span className="text-[11px] text-muted-foreground">
                    {row.draft.segment.name ?? row.draft.segment.programming_segment}
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-7 text-xs"
                  onClick={() => updateRow(row.id, { expanded: !row.expanded })}
                >
                  {row.expanded ? "Hide" : "Edit"}
                </Button>
              </div>
              {!row.expanded && (
                <p className="mt-1 line-clamp-2 font-mono text-[11px] text-muted-foreground">
                  {row.rawText}
                </p>
              )}
              {row.error && <p className="mt-1 text-xs text-destructive">{row.error}</p>}
              {row.expanded && row.draft && (
                <div className="mt-3">
                  <WodIntakeDraft
                    draft={row.draft}
                    catalog={catalog}
                    onChange={(d) => updateRow(row.id, { draft: d, status: "ready" })}
                  />
                </div>
              )}
              {row.expanded && !row.draft && (
                <Textarea
                  className="mt-2 font-mono text-xs"
                  rows={4}
                  value={row.rawText}
                  onChange={(e) => updateRow(row.id, { rawText: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
