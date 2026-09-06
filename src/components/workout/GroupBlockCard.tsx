import { Layers, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CollapsibleWorkoutSegment } from "@/components/workout/CollapsibleWorkoutSegment";
import { GroupScoreRow } from "@/components/workout/GroupScoreRow";
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
  return (
    <Card className="glass-card overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">Multi-part workout</p>
            <h3 className="text-lg font-bold tracking-tight md:text-xl">
              {block.anchor.name ?? "Workout block"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {block.parts.length} parts · one total score · expand parts for movements
            </p>
          </div>
        </div>
        {isComplete && (
          <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </Badge>
        )}
      </div>

      <div className="divide-y divide-border/60">
        {block.parts.map((part, idx) => (
          <div key={part.id}>
            <div className="border-b border-border/40 bg-muted/20 px-4 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Part {idx + 1}
              </p>
            </div>
            <CollapsibleWorkoutSegment
              wod={part}
              items={part.items}
              contactId={contactId}
              rxGender={rxGender}
              perfByItem={perfByItem}
              segmentPerf={perfBySegment.get(part.id) ?? null}
              hideSegmentScore
              compact
              onLogged={onLogged}
            />
          </div>
        ))}
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
    </Card>
  );
}
