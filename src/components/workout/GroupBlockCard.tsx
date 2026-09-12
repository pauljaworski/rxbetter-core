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

/** Linked groups score once; Part labels only when more than one score anchor exists. */
function groupHasMultipleScores(block: GroupBlock): boolean {
  const anchors = block.parts.filter((p) => p.group_score_anchor);
  return anchors.length > 1;
}

function partPreviewMeta(
  part: GroupBlock["parts"][number],
  idx: number,
  blockTitle: string,
  anchorId: string,
  showPartLabels: boolean,
  singleScore: boolean,
  rxGender?: RxGender | null,
): { heading: string | null; movements: string[] } {
  const partName = part.name?.trim();
  const isScoreAnchor = part.id === anchorId;
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
  const distinctName =
    !!partName && partName.toLowerCase() !== blockTitle.toLowerCase() ? partName : null;

  let heading: string | null = null;
  if (showPartLabels) {
    heading = [`Part ${idx + 1}`, distinctName, schemeLabel ?? summary.header]
      .filter(Boolean)
      .join(" · ");
  } else if (singleScore) {
    // Card title is the scored segment; non-scored blocks only show scheme (e.g. 5 RFT).
    const showAnchorName = isScoreAnchor ? distinctName : null;
    heading = [showAnchorName, schemeLabel ?? summary.header].filter(Boolean).join(" · ") || null;
  } else {
    heading = [distinctName, schemeLabel ?? summary.header].filter(Boolean).join(" · ") || null;
  }

  return { heading, movements: summary.lines };
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
  const showPartLabels = groupHasMultipleScores(block);
  const singleScore = !showPartLabels;

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
          </p>
          <h3 className="text-lg font-bold tracking-tight md:text-xl">{title}</h3>
          {!expanded && (
            <div className="mt-2 space-y-0">
              {block.parts.map((part, idx) => {
                const preview = partPreviewMeta(
                  part,
                  idx,
                  title,
                  block.anchor.id,
                  showPartLabels,
                  singleScore,
                  rxGender,
                );
                return (
                  <div key={part.id}>
                    {idx > 0 && (
                      <p className="py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                        Then
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {preview.heading && (
                        <p className="text-xs font-medium text-foreground/80">{preview.heading}</p>
                      )}
                      {preview.movements.map((line, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          {line}
                        </p>
                      ))}
                      {!preview.movements.length && part.description && (
                        <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                          {part.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="pt-2 text-[11px] text-muted-foreground/80">
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
          <div className="border-t border-border/60 px-4 py-2 md:px-5">
            {block.parts.map((part, idx) => {
              const partName = part.name?.trim();
              const isScoreAnchor = part.id === block.anchor.id;
              const distinctName =
                !!partName && partName.toLowerCase() !== title.toLowerCase() ? partName : null;
              // Single-score: only scored segment may show a title; others scheme-only.
              const showPartName = showPartLabels
                ? !!distinctName
                : singleScore
                  ? isScoreAnchor && !!distinctName
                  : !!distinctName;
              const showDescription = !part.items.length && !!part.description;
              const partSchemeLabel = schemeSummaryLabel(parseWorkoutScheme(part.workout_scheme));
              const headingBits = [
                showPartLabels ? `Part ${idx + 1}` : null,
                showPartName ? distinctName : null,
              ].filter(Boolean);

              return (
                <div key={part.id}>
                  {idx > 0 && (
                    <p className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-primary/70">
                      Then
                    </p>
                  )}
                  <div className="py-3">
                    {(headingBits.length > 0 || partSchemeLabel) && (
                      <div className="mb-2 space-y-1">
                        {headingBits.length > 0 && (
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {headingBits.join(" · ")}
                          </p>
                        )}
                        {partSchemeLabel && (
                          <p className="text-sm font-semibold text-primary">{partSchemeLabel}</p>
                        )}
                      </div>
                    )}
                    {showDescription && (
                      <p className="mb-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {part.description}
                      </p>
                    )}
                    {(part.athlete_notes || part.coaches_notes) && (
                      <div className="mb-2 space-y-1 text-sm">
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
            hideSchemeHeadline
            onLogged={onLogged}
          />
        </>
      )}
    </Card>
  );
}
