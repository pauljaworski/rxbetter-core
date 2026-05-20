import { format } from "date-fns";
import { Flame, Timer, Dumbbell, NotebookPen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { segmentLabel } from "@/lib/format";
import { LogScoreRow } from "@/components/rx/LogScoreSheet";
import type { WorkoutDayProgramming, WorkoutPerformance } from "@/hooks/useWorkoutDay";

export function WorkoutDayView({
  wodDate,
  wods,
  perfByItem,
  contactId,
  displayName,
  onLogged,
}: {
  wodDate: string | null;
  wods: WorkoutDayProgramming[];
  perfByItem: Map<string, WorkoutPerformance>;
  contactId: string | null;
  displayName: string | null;
  onLogged: () => void;
}) {
  const dateLabel = wodDate
    ? format(new Date(wodDate + "T00:00:00"), "EEEE, MMM d")
    : "";

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

      {wods.map((w) => (
        <WodCard key={w.id} wod={w} contactId={contactId} perfByItem={perfByItem} onLogged={onLogged} />
      ))}
    </div>
  );
}

function WodCard({
  wod,
  contactId,
  perfByItem,
  onLogged,
}: {
  wod: WorkoutDayProgramming;
  contactId: string | null;
  perfByItem: Map<string, WorkoutPerformance>;
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
        {wod.items.length === 0 && (
          <div className="p-5 text-sm text-muted-foreground">No prescribed sets.</div>
        )}
        {wod.items.map((it) => (
          <LogScoreRow
            key={it.id}
            item={it}
            wod={wod}
            contactId={contactId}
            existing={perfByItem.get(it.id) ?? null}
            onLogged={onLogged}
          />
        ))}
      </div>
    </Card>
  );
}
