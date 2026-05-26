import { format } from "date-fns";

import { Layers, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { CollapsibleWorkoutSegment } from "@/components/workout/CollapsibleWorkoutSegment";

import { GroupScoreRow } from "@/components/workout/GroupScoreRow";

import {

  buildWorkoutDayBlocks,

  groupScoreForBlock,

} from "@/lib/programming/workout-segment-groups";

import {

  isPrescriptionSegmentComplete,

  type CompletionMaps,

} from "@/lib/programming/segment-completion";

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

  completions,

  contactId,

  displayName,

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

            perfByItem={perfByItem}

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

  const loggedItems = new Set(

    wod.items

      .filter((it) => {

        const p = perfByItem.get(it.id);

        return p && (p.weight_lifted != null || p.status);

      })

      .map((it) => it.id),

  );

  const segPerf = perfBySegment.get(wod.id);

  return isPrescriptionSegmentComplete(

    wod.programming_segment,

    wod.items.map((i) => i.id),

    loggedItems,

    !!segPerf?.score,

  );

}



function CompleteBadge({ show }: { show: boolean }) {

  if (!show) return null;

  return (

    <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">

      <CheckCircle2 className="h-3 w-3" />

      Complete

    </Badge>

  );

}



function GroupBlockCard({

  block,

  wodDate,

  contactId,

  perfByItem,

  perfBySegment,

  groupPerf,

  isComplete,

  onLogged,

}: {

  block: Extract<ReturnType<typeof buildWorkoutDayBlocks>[number], { kind: "group" }>;

  wodDate: string;

  contactId: string | null;

  perfByItem: Map<string, WorkoutPerformance>;

  perfBySegment: Map<string, SegmentPerformance>;

  groupPerf: SegmentPerformance | null;

  isComplete: boolean;

  onLogged: () => void;

}) {

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

              {block.parts.length} parts · one total score · expand each part to log

            </p>

          </div>

        </div>

        <CompleteBadge show={isComplete} />

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


