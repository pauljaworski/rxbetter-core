import { LogScoreRow, type ExistingPerformance, type LogLineItem, type LogWodContext } from "@/components/rx/LogScoreSheet";
import { StrengthLiftRow } from "@/components/workout/StrengthLiftRow";

type Props = {
  wod: LogWodContext;
  items: LogLineItem[];
  contactId: string | null;
  perfByItem: Map<string, ExistingPerformance>;
  onLogged?: () => void;
};

export function WorkoutSegmentItems({ wod, items, contactId, perfByItem, onLogged }: Props) {
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
