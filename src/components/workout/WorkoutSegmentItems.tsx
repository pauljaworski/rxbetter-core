import {
  LogScoreRow,
  type ExistingPerformance,
  type LogLineItem,
  type LogWodContext,
} from "@/components/rx/LogScoreSheet";
import { StrengthLiftRow } from "@/components/workout/StrengthLiftRow";
import { MetconScoreRow } from "@/components/workout/MetconScoreRow";
import { RftRoundScoreForm } from "@/components/workout/RftRoundScoreForm";
import { IntervalRoundScoreForm } from "@/components/workout/IntervalRoundScoreForm";
import { MetconMovementList } from "@/components/workout/MetconMovementList";
import { isMetconSegment } from "@/lib/programming/manual-config";
import { rftUsesRoundSplits } from "@/lib/programming/rft-score";
import { isIntervalSeriesScheme } from "@/lib/programming/interval-score";
import { effectiveScoreMetric } from "@/lib/programming/metcon-score";
import { parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";
import type { RxGender } from "@/lib/programming/rx-variants-schema";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  items: LogLineItem[];
  contactId: string | null;
  rxGender?: RxGender | null;
  perfByItem: Map<string, ExistingPerformance>;
  segmentPerf?: SegmentPerformance | null;
  /** When true, segment/group score UI is rendered by a parent (multi-part block). */
  hideSegmentScore?: boolean;
  onLogged?: () => void;
};

export function WorkoutSegmentItems({
  wod,
  items,
  contactId,
  rxGender,
  perfByItem,
  segmentPerf,
  hideSegmentScore,
  onLogged,
}: Props) {
  if (!items.length && !isMetconSegment(wod.programming_segment ?? "")) {
    return <div className="p-5 text-sm text-muted-foreground">No prescribed sets.</div>;
  }

  if (isMetconSegment(wod.programming_segment ?? "")) {
    const scheme = parseWorkoutScheme(wod.workout_scheme);
    const useRftRounds = rftUsesRoundSplits(scheme);
    const useIntervalRounds =
      isIntervalSeriesScheme(scheme) ||
      (scheme != null &&
        "rounds" in scheme &&
        typeof scheme.rounds === "number" &&
        scheme.rounds > 0 &&
        effectiveScoreMetric(scheme.scoreMetric, scheme.kind) === "sum_interval_times");
    return (
      <>
        <MetconMovementList items={items} rxGender={rxGender} />
        {!hideSegmentScore &&
          (useRftRounds ? (
            <RftRoundScoreForm
              wod={wod}
              scheme={scheme}
              contactId={contactId}
              existing={segmentPerf ?? null}
              onLogged={onLogged}
            />
          ) : useIntervalRounds && isIntervalSeriesScheme(scheme) ? (
            <IntervalRoundScoreForm
              wod={wod}
              scheme={scheme}
              contactId={contactId}
              existing={segmentPerf ?? null}
              onLogged={onLogged}
            />
          ) : (
            <MetconScoreRow
              wod={wod}
              contactId={contactId}
              existing={segmentPerf ?? null}
              onLogged={onLogged}
            />
          ))}
      </>
    );
  }

  if (!items.length) {
    return <div className="p-5 text-sm text-muted-foreground">No prescribed sets.</div>;
  }

  const isWeightlifting = wod.programming_segment === "weightlifting";
  const allLiftsLogged =
    isWeightlifting &&
    items.length > 0 &&
    items.every((it) => {
      const p = perfByItem.get(it.id);
      return p && (p.weight_lifted != null || !!p.status);
    });

  return (
    <div
      className={
        allLiftsLogged
          ? "border-t border-emerald-500/30 bg-emerald-500/[0.04]"
          : undefined
      }
    >
      {allLiftsLogged && (
        <div className="flex items-center gap-2 border-b border-emerald-500/20 px-4 py-2.5 md:px-5">
          <Badge className="gap-1 bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Session saved
          </Badge>
          <p className="text-xs text-muted-foreground">
            All sets logged — this block will appear on the leaderboard.
          </p>
        </div>
      )}
      {items.map((it, idx) =>
        isWeightlifting ? (
          <StrengthLiftRow
            key={it.id}
            item={it}
            items={items}
            itemIndex={idx}
            wod={wod}
            contactId={contactId}
            rxGender={rxGender}
            existing={perfByItem.get(it.id) ?? null}
            onLogged={onLogged}
          />
        ) : (
          <LogScoreRow
            key={it.id}
            item={it}
            wod={wod}
            contactId={contactId}
            existing={perfByItem.get(it.id) ?? null}
            onLogged={onLogged}
          />
        ),
      )}
    </div>
  );
}
