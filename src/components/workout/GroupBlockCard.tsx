import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GroupScoreRow } from "@/components/workout/GroupScoreRow";
import { MetconMovementList } from "@/components/workout/MetconMovementList";
import { WorkoutSegmentItems } from "@/components/workout/WorkoutSegmentItems";
import { schemeSummaryLabel, parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import { isMetconSegment } from "@/lib/programming/manual-config";
import { summarizeSegmentPrescription } from "@/lib/programming/segment-prescription-summary";
import { cn } from "@/lib/utils";
import type { WorkoutDayBlock } from "@/lib/programming/workout-segment-groups";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";
import type { ExistingPerformance } from "@/components/rx/LogScoreSheet";
import type { RxGender } from "@/lib/programming/rx-variants-schema";

type GroupBlock = Extract<WorkoutDayBlock, { kind: "group" }>;

type Props = {
  block: GroupBlock;
  wodDate: string;
  contactId: string | null;
  rxGender?: RxGender | null;
  perfByItem: Map<string, ExistingPerformance>;
  perfBySegment: Map<string, SegmentPerformance>;
  groupPerf: SegmentPerformance | null;
  isComplete: boolean;
  onLogged: () => void;
};

function partPreviewLine(
  part: GroupBlock["parts"][number],
  idx: number,
  blockTitle: string,
  rxGender?: RxGender | null,
): string {
  const partName = part.name?.trim();
  const showName = !!partName && partName.toLowerCase() !== blockTitle.toLowerCase();
  const schemeLabel = schemeSummaryLabel(parseWorkoutScheme(part.workout_scheme));
  const summary = summarizeSegmentPrescription(
    {
      programming_segment: part.programming_segment ?? "metcon",
      metcon_format: part.metcon_format,
      workout_scheme: part.workout_scheme,
      name: part.name,
    },
    part.items,
    rxGender ?? null,
  );
  const movCount = part.items.length;
  const bits = [
    `Part ${idx + 1}`,
    showName ? partName : null,
    schemeLabel ?? summary.header,
    movCount > 0 ? `${movCount} mov${movCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

export function GroupBlockCard({
  block,
  wodDate,
  contactId,
  rxGender,
  perfByItem,
  perfBySegment,
  groupPerf,
  isComplete,
  onLogged,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const scheme = parseWorkoutScheme(block.anchor.workout_scheme);
  const schemeLabel = schemeSummaryLabel(scheme);
  const title = block.anchor.name?.trim() || "Workout";

  return (
    <Card className="glass-card overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/30 md:p-5"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            Workout
            {schemeLabel ? ` · ${schemeLabel}` : ""}
            {block.parts.length > 1 ? ` · ${block.parts.length} parts` : ""}
          </p>
          <h3 className="text-lg font-bold tracking-tight md:text-xl">{title}</h3>
          {!expanded && (
            <div className="mt-2 space-y-0.5">
              {block.parts.map((part, idx) => (
                <p key={part.id} className="text-xs text-muted-foreground">
                  {partPreviewLine(part, idx, title, rxGender)}
                </p>
              ))}
              <p className="pt-1 text-[11px] text-muted-foreground/80">
                Tap for full details{contactId ? " and score" : ""}
              </p>
            </div>
          )}
          {expanded && (
            <p className="mt-1 text-xs text-muted-foreground">One score for the full workout</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isComplete && (
            <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
              <CheckCircle2 className="h-3 w-3" />
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
        <>
          <div className="divide-y divide-border/60 border-t border-border/60">
            {block.parts.map((part, idx) => {
              const partName = part.name?.trim();
              const showPartName =
                !!partName && partName.toLowerCase() !== title.toLowerCase();
              const showDescription = !part.items.length && !!part.description;
              const partSchemeLabel = schemeSummaryLabel(parseWorkoutScheme(part.workout_scheme));

              return (
                <div key={part.id} className="px-4 py-4 md:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Part {idx + 1}
                    {showPartName ? ` · ${partName}` : ""}
                  </p>
                  {partSchemeLabel && (
                    <p className="mt-2 text-sm font-semibold text-primary">{partSchemeLabel}</p>
                  )}
                  {showDescription && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {part.description}
                    </p>
                  )}
                  {(part.athlete_notes || part.coaches_notes) && (
                    <div className="mt-2 space-y-1 text-sm">
                      {part.coaches_notes && (
                        <p className="whitespace-pre-line text-foreground/90">{part.coaches_notes}</p>
                      )}
                      {part.athlete_notes && (
                        <p className="whitespace-pre-line text-muted-foreground">
                          {part.athlete_notes}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-2">
                    {isMetconSegment(part.programming_segment ?? "") ? (
                      <MetconMovementList items={part.items} rxGender={rxGender} />
                    ) : (
                      <WorkoutSegmentItems
                        wod={part}
                        items={part.items}
                        contactId={contactId}
                        rxGender={rxGender}
                        perfByItem={perfByItem}
                        segmentPerf={perfBySegment.get(part.id) ?? null}
                        hideSegmentScore
                        onLogged={onLogged}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <GroupScoreRow
            groupId={block.groupId}
            wodDate={wodDate}
            partCount={block.parts.length}
            contactId={contactId}
            existing={groupPerf}
            prescribedScale={block.anchor.prescribed_scale}
            workoutScheme={block.anchor.workout_scheme}
            onLogged={onLogged}
          />
        </>
      )}
    </Card>
  );
}
