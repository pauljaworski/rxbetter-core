import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CollapsibleWorkoutSegment } from "@/components/workout/CollapsibleWorkoutSegment";
import { GroupBlockCard } from "@/components/workout/GroupBlockCard";
import {
  buildWorkoutDayBlocks,
  groupScoreForBlock,
} from "@/lib/programming/workout-segment-groups";
import {
  isPrescriptionSegmentComplete,
  type CompletionMaps,
} from "@/lib/programming/segment-completion";
import { isLoggableLineItem } from "@/lib/programming/line-item-kind";
import type {
  SegmentPerformance,
  WorkoutDayProgramming,
  WorkoutPerformance,
} from "@/hooks/useWorkoutDay";
import type { RxGender } from "@/lib/programming/rx-variants-schema";

export function WorkoutDayView({
  wodDate,
  wods,
  perfByItem,
  perfBySegment,
  perfByGroup,
  completions,
  contactId,
  displayName,
  rxGender,
  onLogged,
}: {
  wodDate: string | null;
  wods: WorkoutDayProgramming[];
  perfByItem: Map<string, WorkoutPerformance>;
  perfBySegment: Map<string, SegmentPerformance>;
  perfByGroup: Map<string, SegmentPerformance>;
  completions: CompletionMaps;
  contactId: string | null;
  displayName: string | null;
  rxGender?: RxGender | null;
  onLogged: () => void;
}) {
  const dateLabel = wodDate
    ? format(new Date(wodDate + "T00:00:00"), "EEEE, MMM d")
    : "";
  const blocks = buildWorkoutDayBlocks(wods);

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-[var(--radius)] border border-border p-6 md:p-8"
        style={{ background: "var(--gradient-hero)" }}
      >
        <p className="eyebrow">Today&apos;s Training</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-5xl">
          {dateLabel || "—"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {displayName ? `Welcome back, ${displayName.split(" ")[0]}.` : "Welcome back."} Tap a
          segment to expand movements and log your work.
        </p>
      </header>

      {blocks.map((block) =>
        block.kind === "group" ? (
          <GroupBlockCard
            key={block.groupId}
            block={block}
            wodDate={wodDate ?? ""}
            contactId={contactId}
            rxGender={rxGender}
            perfByItem={perfByItem as Map<string, import("@/components/rx/LogScoreSheet").ExistingPerformance>}
            perfBySegment={perfBySegment}
            groupPerf={groupScoreForBlock(block, perfByGroup)}
            isComplete={
              completions.completedGroupIds.has(block.groupId) ||
              !!groupScoreForBlock(block, perfByGroup)?.score
            }
            onLogged={onLogged}
          />
        ) : (
          <Card key={block.wod.id} className="glass-card overflow-hidden p-0">
            <CollapsibleWorkoutSegment
              wod={block.wod}
              items={block.wod.items}
              contactId={contactId}
              rxGender={rxGender}
              perfByItem={perfByItem}
              segmentPerf={perfBySegment.get(block.wod.id) ?? null}
              isComplete={
                completions.completedProgramIds.has(block.wod.id) ||
                isSegmentCompleteLive(block.wod, perfByItem, perfBySegment)
              }
              onLogged={onLogged}
            />
          </Card>
        ),
      )}
    </div>
  );
}

function isSegmentCompleteLive(
  wod: WorkoutDayProgramming,
  perfByItem: Map<string, WorkoutPerformance>,
  perfBySegment: Map<string, SegmentPerformance>,
): boolean {
  const loggable = wod.items.filter((it) => isLoggableLineItem(it.line_item_kind));
  const loggedItems = new Set(
    loggable
      .filter((it) => {
        const p = perfByItem.get(it.id);
        return p && (p.weight_lifted != null || p.status);
      })
      .map((it) => it.id),
  );
  const segPerf = perfBySegment.get(wod.id);
  return isPrescriptionSegmentComplete(
    wod.programming_segment,
    loggable.map((i) => i.id),
    loggedItems,
    !!segPerf?.score,
  );
}

/** Optional badge helper kept for callers that want the same Complete chip. */
export function CompleteBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
      <CheckCircle2 className="h-3 w-3" />
      Complete
    </Badge>
  );
}
