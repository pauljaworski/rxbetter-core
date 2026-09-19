import { useState } from "react";
import { CheckCircle2, ChevronDown, Dumbbell, Flame, Timer, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { segmentLabel, prescribedLevelLabel } from "@/lib/format";
import {
  summarizeSegmentPrescription,
} from "@/lib/programming/segment-prescription-summary";
import {
  formatLoggedLiftPreviews,
  formatLoggedScorePreview,
} from "@/lib/programming/athlete-logged-summary";
import { WorkoutSegmentItems } from "@/components/workout/WorkoutSegmentItems";
import { MetconScoreRow } from "@/components/workout/MetconScoreRow";
import { MetconStrategySheet } from "@/components/workout/MetconStrategySheet";
import { isMetconSegment, metconFormatLabel } from "@/lib/programming/manual-config";
import type { LogLineItem, LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";
import type { ExistingPerformance } from "@/components/rx/LogScoreSheet";
import { cn } from "@/lib/utils";
import type { RxGender } from "@/lib/programming/rx-variants-schema";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  wod: LogWodContext & {
    programming_subtype?: string | null;
    workout_scheme?: unknown;
    description?: string | null;
    athlete_notes?: string | null;
    coaches_notes?: string | null;
    metcon_format?: string | null;
    source?: "gym" | "athlete_custom";
  };
  items: LogLineItem[];
  contactId: string | null;
  rxGender?: RxGender | null;
  perfByItem: Map<string, ExistingPerformance>;
  segmentPerf?: SegmentPerformance | null;
  hideSegmentScore?: boolean;
  isComplete?: boolean;
  onLogged?: () => void;
  /** Compact header for use inside multi-part blocks */
  compact?: boolean;
};

export function CollapsibleWorkoutSegment({
  wod,
  items,
  contactId,
  rxGender,
  perfByItem,
  segmentPerf,
  hideSegmentScore,
  isComplete,
  onLogged,
  compact,
}: Props) {
  const { activeGymId } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [scoreOnly, setScoreOnly] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const metcon = isMetconSegment(wod.programming_segment ?? "");
  /** Every standalone segment gets a Log score / Log lifts control when signed in. */
  const canQuickLog = !hideSegmentScore && !compact && !!contactId;
  const canStrategy = metcon && !!contactId && !!activeGymId && !compact;
  const summary = summarizeSegmentPrescription(
    {
      programming_segment: wod.programming_segment ?? "metcon",
      metcon_format: wod.metcon_format,
      workout_scheme: wod.workout_scheme,
      name: wod.name,
    },
    items,
    rxGender ?? null,
  );
  /** Full movement list on collapsed cards (same text size; no cutoff). */
  const preview = {
    header: summary.header,
    lines: summary.lines,
    moreCount: 0,
  };
  const loggedScore = metcon ? formatLoggedScorePreview(segmentPerf) : null;
  const loggedLifts = !metcon ? formatLoggedLiftPreviews(items, perfByItem) : [];
  const hasLoggedResult = !!loggedScore || loggedLifts.length > 0;
  const formatLabel = metconFormatLabel(wod.metcon_format);

  const segIcon =
    wod.programming_segment === "metcon"
      ? Timer
      : wod.programming_segment === "weightlifting"
        ? Dumbbell
        : Flame;
  const Icon = segIcon;

  function handleLogClick() {
    if (metcon) {
      setScoreOnly((v) => !v);
      return;
    }
    // Strength / skill: open full details so the athlete can log sets.
    setExpanded(true);
    setScoreOnly(false);
  }

  return (
    <div className={cn(!compact && "border-b border-border/60 last:border-b-0")}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "flex w-full items-start justify-between gap-3 text-left transition-colors hover:bg-secondary/30",
          compact ? "px-4 py-3" : "p-5",
        )}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {!compact && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="eyebrow">
              {segmentLabel(wod.programming_segment, wod.programming_subtype)}
              {formatLabel ? ` · ${formatLabel}` : ""}
              {wod.prescribed_scale &&
              wod.prescribed_scale !== "na" &&
              prescribedLevelLabel(wod.prescribed_scale)
                ? ` · ${prescribedLevelLabel(wod.prescribed_scale)}`
                : ""}
              {wod.source === "athlete_custom" && (
                <Badge variant="secondary" className="ml-2 align-middle text-[9px]">
                  Personal
                </Badge>
              )}
            </p>
            <h3
              className={cn(
                "font-bold tracking-tight",
                compact ? "text-sm" : "text-lg md:text-xl",
              )}
            >
              {wod.name ?? "Untitled"}
            </h3>
            {!expanded && (
              <div className="mt-2 space-y-0.5">
                {preview.header && (
                  <p className="text-xs font-medium text-primary/80">{preview.header}</p>
                )}
                {preview.lines.map((line, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {line}
                  </p>
                ))}
                {preview.moreCount > 0 && (
                  <p className="text-[11px] text-muted-foreground/80">
                    +{preview.moreCount} more · tap for details
                  </p>
                )}
                {!items.length && wod.description && (
                  <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                    {wod.description}
                  </p>
                )}
                {preview.moreCount === 0 && items.length > 0 && (
                  <p className="pt-0.5 text-[11px] text-muted-foreground/80">Tap for details</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isComplete && (
            <Badge variant="secondary" className="text-[10px]">
              Complete
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {!expanded && canQuickLog && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/40 px-4 py-3 md:px-5">
          {hasLoggedResult && !scoreOnly ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {metcon ? "Your score" : "Your lifts"}
              </p>
              {loggedScore ? (
                <p className="font-mono-num text-lg font-bold tracking-tight text-foreground">
                  {loggedScore}
                </p>
              ) : (
                <ul className="mt-0.5 space-y-0.5">
                  {loggedLifts.map((lift, i) => (
                    <li key={i} className="text-sm text-foreground">
                      <span className="text-muted-foreground">{lift.name}</span>
                      <span className="font-mono-num font-semibold"> · {lift.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canStrategy && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setStrategyOpen(true);
                }}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Strategy
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={scoreOnly && metcon ? "secondary" : "default"}
              className={cn(
                "shrink-0",
                !(scoreOnly && metcon) && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
              onClick={handleLogClick}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              {metcon
                ? scoreOnly
                  ? "Hide score"
                  : isComplete || loggedScore
                    ? "Update score"
                    : "Log score"
                : isComplete || loggedLifts.length > 0
                  ? "Update lifts"
                  : "Log score"}
            </Button>
          </div>
        </div>
      )}

      {scoreOnly && !expanded && canQuickLog && metcon && (
        <MetconScoreRow
          wod={wod}
          contactId={contactId}
          existing={segmentPerf ?? null}
          onLogged={onLogged}
        />
      )}

      {expanded && (
        <div className="border-t border-border/60 bg-card/50">
          {canStrategy && (
            <div className="flex justify-end border-b border-border/60 px-4 py-2 md:px-5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setStrategyOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Strategy
              </Button>
            </div>
          )}
          {summary.header && (
            <p className="border-b border-border/60 px-5 py-2.5 text-sm font-semibold text-primary">
              {summary.header}
            </p>
          )}
          {!items.length && wod.description && (
            <p className="whitespace-pre-line border-b border-border/60 px-5 py-3 text-sm leading-relaxed text-muted-foreground">
              {wod.description}
            </p>
          )}
          {(wod.athlete_notes || wod.coaches_notes) && (
            <div className="space-y-2 border-b border-border/60 bg-secondary/20 px-5 py-3 text-sm">
              {wod.coaches_notes && (
                <p className="whitespace-pre-line text-foreground/90">{wod.coaches_notes}</p>
              )}
              {wod.athlete_notes && (
                <p className="whitespace-pre-line text-muted-foreground">{wod.athlete_notes}</p>
              )}
            </div>
          )}
          <WorkoutSegmentItems
            wod={wod}
            items={items}
            contactId={contactId}
            rxGender={rxGender}
            perfByItem={perfByItem}
            segmentPerf={segmentPerf ?? null}
            hideSegmentScore={hideSegmentScore}
            onLogged={onLogged}
          />
        </div>
      )}

      <MetconStrategySheet
        open={strategyOpen}
        onOpenChange={setStrategyOpen}
        programmingId={wod.id}
        workoutName={wod.name}
      />
    </div>
  );
}
