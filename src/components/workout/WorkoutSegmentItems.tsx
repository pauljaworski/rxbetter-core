import {
  LogScoreRow,
  type ExistingPerformance,
  type LogLineItem,
  type LogWodContext,
} from "@/components/rx/LogScoreSheet";
import { StrengthLiftRow } from "@/components/workout/StrengthLiftRow";
import { MetconScoreRow } from "@/components/workout/MetconScoreRow";
import { MetconMovementList } from "@/components/workout/MetconMovementList";
import { isMetconSegment } from "@/lib/programming/manual-config";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  items: LogLineItem[];
  contactId: string | null;
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
  perfByItem,
  segmentPerf,
  hideSegmentScore,
  onLogged,
}: Props) {
  if (!items.length && !isMetconSegment(wod.programming_segment ?? "")) {
    return <div className="p-5 text-sm text-muted-foreground">No prescribed sets.</div>;
  }

  if (isMetconSegment(wod.programming_segment ?? "")) {
    return (
      <>
        <MetconMovementList items={items} />
        {!hideSegmentScore && (
          <MetconScoreRow
            wod={wod}
            contactId={contactId}
            existing={segmentPerf ?? null}
            onLogged={onLogged}
          />
        )}
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
