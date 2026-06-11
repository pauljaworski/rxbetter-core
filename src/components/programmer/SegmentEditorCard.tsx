import { useState } from "react";
import { Trash2, Plus, Copy, Save, Sparkles } from "lucide-react";
import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import type { ProgramLibrary } from "@/hooks/staff/types";
import { useBenchmarkCatalog } from "@/hooks/staff/useBenchmarkCatalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isSegmentUnsaved } from "@/lib/programming/staff-programming-state";
import {
  MANUAL_PROGRAMMING_TYPES,
  WORKOUT_FORMAT_TEMPLATES,
  canAddMovement,
  getLineItemMode,
  getTypeByUiKey,
  movementDisplayName,
  programmingSubtypeForUiKey,
  requiresMetconFormat,
  resolveProgrammingUiKey,
  isMetconSegment,
} from "@/lib/programming/manual-config";
import {
  parseWorkoutScheme,
  schemeSummaryLabel,
  type WorkoutScheme,
} from "@/lib/programming/workout-scheme-schema";
import {
  editorLineItemsFromMetconMovements,
  parseMetconMovements,
} from "@/lib/programming/parse-metcon-movements";
import { applyWorkoutFormatKind, MetconSchemeFields } from "./MetconSchemeFields";
import { LineItemFields } from "./LineItemFields";
import { toast } from "sonner";

type Props = {
  wod: EditorWod;
  wodIndex: number;
  allWods: EditorWod[];
  libraries: ProgramLibrary[];
  saving?: boolean;
  onUpdate: (patch: Partial<EditorWod>) => void;
  onRemove: () => void;
  onSaveSection: () => void;
  onUpdateItem: (itemIdx: number, patch: Partial<EditorLineItem>) => void;
  onRemoveItem: (itemIdx: number) => void;
  onCloneItem: (itemIdx: number) => void;
  onAddMovement: () => void;
  onOpenComplexEditor: () => void;
};

export function SegmentEditorCard({
  wod,
  libraries,
  saving,
  onUpdate,
  onRemove,
  onSaveSection,
  onUpdateItem,
  onRemoveItem,
  onCloneItem,
  onAddMovement,
  wodIndex,
  allWods,
  onOpenComplexEditor,
}: Props) {
  const { data: catalog } = useBenchmarkCatalog();
  const [bulkPaste, setBulkPaste] = useState("");
  const uiKey = resolveProgrammingUiKey(wod);
  const lineMode = getLineItemMode(wod.programming_segment);
  const addEnabled = canAddMovement(wod);
  const metcon = isMetconSegment(wod.programming_segment);
  const isStrength =
    wod.programming_segment === "weightlifting" || wod.programming_segment === "strength";
  const priorGroupId =
    wodIndex > 0 ? allWods[wodIndex - 1]?.segment_group_id ?? null : null;
  const libIds = wod.program_library_ids?.length
    ? wod.program_library_ids
    : wod.program_library_id
      ? [wod.program_library_id]
      : [];

  function setTypeUiKey(key: string) {
    const t = getTypeByUiKey(key);
    if (!t) return;
    onUpdate({
      programming_segment: t.dbSegment,
      metcon_format: t.requiresFormat ? wod.metcon_format : null,
      programming_subtype: programmingSubtypeForUiKey(key),
    });
  }

  function applyWorkoutFormat(kind: WorkoutScheme["kind"]) {
    onUpdate(applyWorkoutFormatKind(kind));
  }

  const formatSelectValue =
    parseWorkoutScheme(wod.workout_scheme)?.kind ?? wod.metcon_format ?? "";

  function parseBulkMovements() {
    const text = bulkPaste.trim() || (wod.description ?? "").trim();
    if (!text) {
      toast.error("Paste workout text first");
      return;
    }
    const parsed = parseMetconMovements(text, catalog);
    const items = editorLineItemsFromMetconMovements(parsed.movements);
    if (!items.length) {
      toast.error("No movements recognized", {
        description: parsed.warnings[0] ?? "Try lines like: 10 Wall Balls, 15 Pull-ups",
      });
      return;
    }
    const patch: Partial<EditorWod> = { items };
    if (parsed.metconFormat) {
      patch.metcon_format = parsed.metconFormat;
      patch.workout_scheme =
        parsed.scheme ??
        (parsed.metconFormat
          ? applyWorkoutFormatKind(
              parsed.metconFormat === "amrap"
                ? "amrap"
                : parsed.metconFormat === "emom"
                  ? "emom"
                  : parsed.metconFormat === "chipper"
                    ? "chipper"
                    : "for_time",
            ).workout_scheme
          : null);
    } else if (parsed.scheme) {
      patch.workout_scheme = parsed.scheme;
    }
    if (parsed.scheme && !wod.name?.trim()) {
      patch.name = schemeSummaryLabel(parsed.scheme) ?? wod.name;
    }
    onUpdate(patch);
    if (parsed.warnings.length) {
      toast.message("Parsed with warnings", { description: parsed.warnings.join(" · ") });
    } else {
      toast.success(`Added ${items.length} movement${items.length === 1 ? "" : "s"}`);
    }
    setBulkPaste("");
  }

  function toggleLibrary(libId: string, checked: boolean) {
    const next = new Set(libIds);
    if (checked) next.add(libId);
    else next.delete(libId);
    const ids = Array.from(next);
    onUpdate({
      program_library_ids: ids,
      program_library_id: ids[0] ?? null,
    });
  }

  return (
    <Card className="glass-card overflow-hidden p-0">
      {/* Type, name, add movement */}
      <div className="space-y-3 border-b border-border/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={uiKey} onValueChange={setTypeUiKey}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_PROGRAMMING_TYPES.map((s) => (
                <SelectItem key={s.uiKey} value={s.uiKey}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {requiresMetconFormat(wod.programming_segment) && (
            <Select
              value={formatSelectValue}
              onValueChange={(v) => applyWorkoutFormat(v as WorkoutScheme["kind"])}
            >
              <SelectTrigger className="h-9 min-w-[10rem]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_FORMAT_TEMPLATES.map((f) => (
                  <SelectItem key={f.kind} value={f.kind}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            value={wod.name ?? ""}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Segment name *"
            className="h-9 min-w-[10rem] flex-1"
          />
          {isStrength && (
            <Button size="sm" variant="outline" onClick={onOpenComplexEditor}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Complex set
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={onAddMovement}
                    size="sm"
                    variant="outline"
                    disabled={!addEnabled}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add movement
                  </Button>
                </span>
              </TooltipTrigger>
              {!addEnabled && (
                <TooltipContent>
                  {requiresMetconFormat(wod.programming_segment) && !wod.metcon_format
                    ? "Select a format first."
                    : "Select a programming type first."}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {isSegmentUnsaved(wod) ? (
            <Badge variant="outline" className="text-[10px] text-amber-600">
              Unsaved
            </Badge>
          ) : wod.published_at ? (
            <Badge variant="secondary" className="text-[10px]">
              Published
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Saved · not published
            </Badge>
          )}
          <Button
            size="sm"
            onClick={onSaveSection}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save section"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove segment"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {libraries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tracks
            </span>
            {libraries.map((lib) => (
              <label
                key={lib.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-xs"
              >
                <Checkbox
                  checked={libIds.includes(lib.id)}
                  onCheckedChange={(c) => toggleLibrary(lib.id, c === true)}
                />
                {lib.name}
              </label>
            ))}
          </div>
        )}

        {lineMode === "tracking_only" && (
          <p className="rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
            Athletes log one workout score on this segment (time/reps). Movements below are for
            tracking only.
          </p>
        )}

        {(metcon || wod.segment_group_id) && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border/80 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Multi-part block
            </span>
            {wod.segment_group_id ? (
              <>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {wod.segment_group_id.slice(0, 8)}…
                </Badge>
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={wod.group_score_anchor ?? false}
                    onCheckedChange={(c) =>
                      onUpdate({ group_score_anchor: c === true })
                    }
                  />
                  Total score anchor
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() =>
                    onUpdate({ segment_group_id: null, group_score_anchor: false })
                  }
                >
                  Leave block
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() =>
                    onUpdate({
                      segment_group_id: crypto.randomUUID(),
                      group_score_anchor: true,
                    })
                  }
                >
                  Start block
                </Button>
                {priorGroupId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      onUpdate({
                        segment_group_id: priorGroupId,
                        group_score_anchor: false,
                      })
                    }
                  >
                    Join previous block
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {metcon && wod.metcon_format && (
          <MetconSchemeFields wod={wod} onUpdate={onUpdate} />
        )}

        {metcon && (
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Bulk paste movements
            </Label>
            <Textarea
              value={bulkPaste}
              onChange={(e) => setBulkPaste(e.target.value)}
              placeholder={'e.g. 3 RFT: 400m Run, 20 Wall Balls, 15 T2B\nor AMRAP 12 — one movement per line'}
              rows={3}
              className="text-sm font-mono"
            />
            <Button type="button" size="sm" variant="secondary" onClick={parseBulkMovements}>
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Parse into movements
            </Button>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="divide-y divide-border/60">
        {wod.items.length === 0 && (
          <p className="px-4 py-3 text-xs italic text-muted-foreground">
            No movements yet. Add at least one line item, then save this section.
          </p>
        )}
        {wod.items.map((it, j) => (
          <div key={it.id ?? `i-${j}`} className="space-y-2 p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono-num inline-grid h-6 w-6 place-items-center rounded-md bg-secondary text-[11px] font-bold text-muted-foreground">
                {j + 1}
              </span>
              <p className="flex-1 text-sm font-bold">{movementDisplayName(it)}</p>
              {!it.benchmark_type_id && (
                <Badge variant="secondary" className="text-[10px]">
                  Custom
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onCloneItem(j)}
                aria-label="Clone line item"
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onRemoveItem(j)}
                aria-label="Remove movement"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <LineItemFields
              mode={lineMode}
              item={it}
              onChange={(patch) => onUpdateItem(j, patch)}
            />
          </div>
        ))}
      </div>

      {/* Description and notes */}
      <div className="space-y-3 border-t border-border/60 p-4">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Workout description
          </Label>
          <Textarea
            value={wod.description ?? ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Optional workout text…"
            rows={2}
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Coach&apos;s notes
            </Label>
            <Textarea
              value={wod.coaches_notes ?? ""}
              onChange={(e) => onUpdate({ coaches_notes: e.target.value })}
              rows={2}
              placeholder="Cues, demo focus…"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Athlete notes
            </Label>
            <Textarea
              value={wod.athlete_notes ?? ""}
              onChange={(e) => onUpdate({ athlete_notes: e.target.value })}
              rows={2}
              placeholder="Scaling options, intent…"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
