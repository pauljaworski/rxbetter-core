import { useState } from "react";
import { ChevronDown, Dumbbell, Flame, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { segmentLabel } from "@/lib/format";
import { summarizeSegmentPrescription } from "@/lib/programming/segment-prescription-summary";
import { WorkoutSegmentItems } from "@/components/workout/WorkoutSegmentItems";
import type { LogLineItem, LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";
import type { ExistingPerformance } from "@/components/rx/LogScoreSheet";
import { cn } from "@/lib/utils";
import type { RxGender } from "@/lib/programming/rx-variants-schema";

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
  const [expanded, setExpanded] = useState(false);
  const summary = summarizeSegmentPrescription(
    {
      programming_segment: wod.programming_segment ?? "metcon",
      metcon_format: wod.metcon_format,
      workout_scheme: wod.workout_scheme,
      name: wod.name,
    },
    items,
  );

  const segIcon =
    wod.programming_segment === "metcon"
      ? Timer
      : wod.programming_segment === "weightlifting"
        ? Dumbbell
        : Flame;
  const Icon = segIcon;

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
              {wod.metcon_format ? ` · ${wod.metcon_format.toUpperCase()}` : ""}
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
                {summary.lines.map((line, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {line}
                  </p>
                ))}
                {summary.footer && (
                  <p className="text-xs font-medium text-primary/80">{summary.footer}</p>
                )}
                {wod.description && (
                  <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                    {wod.description}
                  </p>
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

      {expanded && (
        <div className="border-t border-border/60 bg-card/50">
          {wod.description && (
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
    </div>
  );
}
