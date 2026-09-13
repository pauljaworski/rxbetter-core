import { MetconScoreRow } from "@/components/workout/MetconScoreRow";
import { RftRoundScoreForm } from "@/components/workout/RftRoundScoreForm";
import { IntervalRoundScoreForm } from "@/components/workout/IntervalRoundScoreForm";
import { parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import { resolveSegmentScoreFormKind } from "@/lib/programming/segment-score-form";
import type { LogWodContext } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

type Props = {
  wod: LogWodContext & { workout_scheme?: unknown };
  contactId: string | null;
  existing: SegmentPerformance | null;
  onLogged?: () => void;
};

/** Shared metcon score UI for expanded details and collapsed Log score. */
export function SegmentScoreFields({ wod, contactId, existing, onLogged }: Props) {
  const scheme = parseWorkoutScheme(wod.workout_scheme);
  const kind = resolveSegmentScoreFormKind(scheme);

  if (kind === "rft_splits" && scheme?.kind === "rft") {
    return (
      <RftRoundScoreForm
        wod={wod}
        scheme={scheme}
        contactId={contactId}
        existing={existing}
        onLogged={onLogged}
      />
    );
  }

  if (kind === "interval" && scheme?.kind === "interval_series") {
    return (
      <IntervalRoundScoreForm
        wod={wod}
        scheme={scheme}
        contactId={contactId}
        existing={existing}
        onLogged={onLogged}
      />
    );
  }

  return <MetconScoreRow wod={wod} contactId={contactId} existing={existing} onLogged={onLogged} />;
}
