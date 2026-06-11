import {
  LogScoreRow,
  type ExistingPerformance,
  type LogLineItem,
  type LogWodContext,
} from "@/components/rx/LogScoreSheet";
import { StrengthLiftRow } from "@/components/workout/StrengthLiftRow";
import { MetconScoreRow } from "@/components/workout/MetconScoreRow";
import { RftRoundScoreForm } from "@/components/workout/RftRoundScoreForm";
import { MetconMovementList } from "@/components/workout/MetconMovementList";
import { isMetconSegment } from "@/lib/programming/manual-config";
import { rftUsesRoundSplits } from "@/lib/programming/rft-score";
import { parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";
import type { RxGender } from "@/lib/programming/rx-variants-schema";

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

  return (
    <>
      {items.map((it) =>
        wod.programming_segment === "weightlifting" ? (
          <StrengthLiftRow
            key={it.id}
            item={it}
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
    </>
  );
}
