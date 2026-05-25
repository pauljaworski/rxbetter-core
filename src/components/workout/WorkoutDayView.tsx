import { format } from "date-fns";
import { Flame, Timer, Dumbbell, NotebookPen, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { segmentLabel } from "@/lib/format";
import { WorkoutSegmentItems } from "@/components/workout/WorkoutSegmentItems";
import { GroupScoreRow } from "@/components/workout/GroupScoreRow";
import {
  buildWorkoutDayBlocks,
  groupScoreForBlock,
} from "@/lib/programming/workout-segment-groups";
import type {
  SegmentPerformance,
  WorkoutDayProgramming,
  WorkoutPerformance,
} from "@/hooks/useWorkoutDay";

export function WorkoutDayView({
  wodDate,
  wods,
  perfByItem,
  perfBySegment,
  perfByGroup,
  contactId,
  displayName,
  onLogged,
}: {
  wodDate: string | null;
  wods: WorkoutDayProgramming[];
  perfByItem: Map<string, WorkoutPerformance>;
  perfBySegment: Map<string, SegmentPerformance>;
  perfByGroup: Map<string, SegmentPerformance>;
  contactId: string | null;
  displayName: string | null;
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
        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-5xl">{dateLabel || "—"}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {displayName ? `Welcome back, ${displayName.split(" ")[0]}.` : "Welcome back."} Log each
          segment below — scores save to your performance ledger.
        </p>
      </header>

      {blocks.map((block) =>
        block.kind === "group" ? (
          <GroupBlockCard
            key={block.groupId}
            block={block}
            wodDate={wodDate ?? ""}
            contactId={contactId}
            perfByItem={perfByItem}
            perfBySegment={perfBySegment}
            groupPerf={groupScoreForBlock(block, perfByGroup)}
            onLogged={onLogged}
          />
        ) : (
          <WodCard
            key={block.wod.id}
            wod={block.wod}
            contactId={contactId}
            perfByItem={perfByItem}
            segmentPerf={perfBySegment.get(block.wod.id) ?? null}
            hideSegmentScore={false}
            onLogged={onLogged}
          />
        ),
      )}
    </div>
  );
}

function GroupBlockCard({
  block,
  wodDate,
  contactId,
  perfByItem,
  perfBySegment,
  groupPerf,
  onLogged,
}: {
  block: Extract<ReturnType<typeof buildWorkoutDayBlocks>[number], { kind: "group" }>;
  wodDate: string;
  contactId: string | null;
  perfByItem: Map<string, WorkoutPerformance>;
  perfBySegment: Map<string, SegmentPerformance>;
  groupPerf: SegmentPerformance | null;
  onLogged: () => void;
}) {
  return (
    <Card className="glass-card overflow-hidden p-0">
      <div className="flex items-start gap-3 border-b border-border/60 p-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">Multi-part workout</p>
          <h3 className="text-lg font-bold tracking-tight md:text-xl">
            {block.anchor.name ?? "Workout block"}
          </h3>
          <p className="text-xs text-muted-foreground">{block.parts.length} parts · one total score</p>
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {block.parts.map((part, idx) => (
          <div key={part.id}>
            <div className="border-b border-border/40 bg-muted/20 px-5 py-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Part {idx + 1}
                {part.name ? ` · ${part.name}` : ""}
              </p>
            </div>
            <WorkoutSegmentItems
              wod={{
                id: part.id,
                name: part.name,
                wod_date: part.wod_date,
                programming_segment: part.programming_segment,
                prescribed_scale: part.prescribed_scale,
                workout_scheme: part.workout_scheme,
              }}
              items={part.items}
              contactId={contactId}
              perfByItem={perfByItem}
              segmentPerf={perfBySegment.get(part.id) ?? null}
              hideSegmentScore
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
        onLogged={onLogged}
      />
    </Card>
  );
}

function WodCard({
  wod,
  contactId,
  perfByItem,
  segmentPerf,
  hideSegmentScore,
  onLogged,
}: {
  wod: WorkoutDayProgramming;
  contactId: string | null;
  perfByItem: Map<string, WorkoutPerformance>;
  segmentPerf: SegmentPerformance | null;
  hideSegmentScore: boolean;
  onLogged: () => void;
}) {
  const segIcon =
    wod.programming_segment === "metcon" ? Timer : wod.programming_segment === "weightlifting" ? Dumbbell : Flame;
  const Icon = segIcon;

  return (
    <Card className="glass-card overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">
              {segmentLabel(wod.programming_segment)}
              {wod.metcon_format ? ` · ${wod.metcon_format.toUpperCase()}` : ""}
              {wod.prescribed_scale ? ` · ${wod.prescribed_scale.replace("_", " ")}` : ""}
            </p>
            <h3 className="text-lg font-bold tracking-tight md:text-xl">{wod.name ?? "Untitled"}</h3>
          </div>
        </div>
      </div>
      {wod.description && (
        <p className="whitespace-pre-line border-b border-border/60 p-5 text-sm leading-relaxed text-muted-foreground">
          {wod.description}
        </p>
      )}
      {(wod.athlete_notes || wod.coaches_notes) && (
        <div className="space-y-2 border-b border-border/60 bg-secondary/30 p-5">
          {wod.coaches_notes && (
            <div>
              <p className="eyebrow flex items-center gap-1">
                <NotebookPen className="h-3 w-3" /> Coach&apos;s notes
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {wod.coaches_notes}
              </p>
            </div>
          )}
          {wod.athlete_notes && (
            <div>
              <p className="eyebrow">Athlete notes</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {wod.athlete_notes}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="divide-y divide-border/60">
        <WorkoutSegmentItems
          wod={{
            id: wod.id,
            name: wod.name,
            wod_date: wod.wod_date,
            programming_segment: wod.programming_segment,
            prescribed_scale: wod.prescribed_scale,
            workout_scheme: wod.workout_scheme,
          }}
          items={wod.items}
          contactId={contactId}
          perfByItem={perfByItem}
          segmentPerf={segmentPerf}
          hideSegmentScore={hideSegmentScore}
          onLogged={onLogged}
        />
      </div>
    </Card>
  );
}
