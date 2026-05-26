import { useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Flame, Users } from "lucide-react";
import { seededHash, seededSample, segmentLabel } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammingWeek } from "@/hooks/useProgrammingWeek";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { summarizeSegmentPrescription } from "@/lib/programming/segment-prescription-summary";
import { WorkoutSegmentItems } from "@/components/workout/WorkoutSegmentItems";
import type { GymAthlete } from "@/hooks/useProgrammingWeek";

type ClassSlot = {
  key: string;
  time: string;
  label: string;
  durationMin: number;
  type: string;
};

const COACH_POOL = [
  "Coach Riley",
  "Coach Morgan",
  "Coach Avery",
  "Coach Jordan",
  "Coach Sam",
  "Coach Drew",
  "Coach Casey",
];

const FILLER_NAMES = [
  "Alex Reyes",
  "Jamie Chen",
  "Taylor Brooks",
  "Sydney Patel",
  "Devon Walker",
  "Riley Nguyen",
  "Morgan Hayes",
  "Quinn Foster",
  "Bailey Ortiz",
  "Hayden Cole",
  "Reese Adler",
  "Parker Lin",
];

function classesForDay(date: Date): ClassSlot[] {
  const dow = date.getDay();
  const weekday: ClassSlot[] = [
    { key: "0600", time: "06:00", label: "6:00 AM", durationMin: 60, type: "CrossFit" },
    { key: "0900", time: "09:00", label: "9:00 AM", durationMin: 60, type: "CrossFit" },
    { key: "1200", time: "12:00", label: "12:00 PM", durationMin: 45, type: "CrossFit" },
    { key: "1730", time: "17:30", label: "5:30 PM", durationMin: 60, type: "CrossFit" },
    { key: "1830", time: "18:30", label: "6:30 PM", durationMin: 60, type: "CrossFit" },
  ];
  const sat: ClassSlot[] = [
    { key: "0800", time: "08:00", label: "8:00 AM", durationMin: 60, type: "Partner WOD" },
    { key: "0900", time: "09:00", label: "9:00 AM", durationMin: 60, type: "CrossFit" },
  ];
  const sun: ClassSlot[] = [
    { key: "0900", time: "09:00", label: "9:00 AM", durationMin: 60, type: "Open Gym" },
  ];
  if (dow === 0) return sun;
  if (dow === 6) return sat;
  return weekday;
}

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function CalendarPage() {
  const { contactId, activeGymId, mode } = useAuth();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selected, setSelected] = useState<Date>(new Date());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openClass, setOpenClass] = useState<{ date: Date; slot: ClassSlot } | null>(null);

  const { data, isLoading, error, refetch } = useProgrammingWeek(activeGymId, contactId, weekStart);
  const { wods, itemsByWod, perfByItem, perfBySegment, athletes } = data;

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const wodsByDay = useMemo(() => {
    const m = new Map<string, typeof wods>();
    for (const w of wods) {
      const arr = m.get(w.wod_date) ?? [];
      arr.push(w);
      m.set(w.wod_date, arr);
    }
    return m;
  }, [wods]);

  const selectedKey = dayKey(selected);
  const selectedWods = wodsByDay.get(selectedKey) ?? [];
  const selectedClasses = classesForDay(selected);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  if (mode === "personal") {
    return (
      <EmptyState
        title="Calendar requires a gym"
        description="Join a gym via your coach's invite link to see the weekly schedule."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Schedule</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Programming and class schedule across the week. Tap a class to see the coach and roster.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      <Card className="glass-card p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {weekLabel}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const isSelected = isSameDay(d, selected);
            const isToday = isSameDay(d, new Date());
            const hasWod = wodsByDay.has(dayKey(d));
            return (
              <button
                key={dayKey(d)}
                onClick={() => setSelected(d)}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 text-center transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground hover:border-border hover:bg-secondary",
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {format(d, "EEE")}
                </span>
                <span
                  className={cn(
                    "font-mono-num text-lg font-black leading-none",
                    isSelected && "text-primary",
                  )}
                >
                  {format(d, "d")}
                </span>
                <span className="flex items-center gap-1">
                  {isToday && (
                    <span className="h-1 w-1 rounded-full bg-accent" aria-label="Today" />
                  )}
                  {hasWod && (
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        isSelected ? "bg-primary" : "bg-primary/60",
                      )}
                      aria-label="Has programming"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight">{format(selected, "EEEE, MMM d")}</h2>
          <span className="text-xs text-muted-foreground">
            {selectedClasses.length} classes · {selectedWods.length} WOD
            {selectedWods.length === 1 ? "" : "s"}
          </span>
        </div>

        <section className="space-y-3">
          <p className="eyebrow flex items-center gap-1.5">
            <Flame className="h-3 w-3" /> Programming
          </p>
          {isLoading && <PageSkeleton rows={2} />}
          {!isLoading && !error && selectedWods.length === 0 && (
            <EmptyState
              title="No workouts this day"
              description="Programming may not be published yet for this date."
            />
          )}
          {!isLoading && !error && selectedWods.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {selectedWods.map((w) => {
                const items = itemsByWod.get(w.id) ?? [];
                const summary = summarizeSegmentPrescription(w, items);
                const isOpen = expanded.has(w.id);
                return (
                <Card key={w.id} className="glass-card overflow-hidden p-0">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(w.id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <p className="eyebrow">
                        {segmentLabel(w.programming_segment)}
                        {w.metcon_format ? ` · ${w.metcon_format.toUpperCase()}` : ""}
                      </p>
                      <h3 className="mt-1 text-base font-bold leading-tight">
                        {w.name ?? "Untitled"}
                      </h3>
                      {!isOpen && (
                        <div className="mt-2 space-y-0.5">
                          {summary.lines.map((line, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {line}
                            </p>
                          ))}
                          {summary.footer && (
                            <p className="text-xs font-medium text-primary/80">{summary.footer}</p>
                          )}
                          {w.description && (
                            <p className="line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                              {w.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/60">
                      {w.description && (
                        <p className="whitespace-pre-line border-b border-border/60 p-4 text-xs leading-relaxed text-muted-foreground">
                          {w.description}
                        </p>
                      )}
                      <div className="divide-y divide-border/60">
                        <WorkoutSegmentItems
                          wod={{
                            id: w.id,
                            name: w.name,
                            wod_date: w.wod_date,
                            programming_segment: w.programming_segment,
                            prescribed_scale: w.prescribed_scale,
                            workout_scheme: w.workout_scheme,
                          }}
                          items={items}
                          contactId={contactId}
                          perfByItem={perfByItem}
                          segmentPerf={perfBySegment.get(w.id) ?? null}
                          onLogged={refetch}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 space-y-3">
          <p className="eyebrow flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Classes
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedClasses.map((slot) => {
              const seed = `${dayKey(selected)}:${slot.key}`;
              const coach = COACH_POOL[seededHash(seed) % COACH_POOL.length];
              const cap = 16;
              const count = 4 + (seededHash(seed + ":n") % 11);
              return (
                <button
                  key={slot.key}
                  onClick={() => setOpenClass({ date: selected, slot })}
                  className="group rounded-[var(--radius)] border border-border bg-card/80 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono-num text-base font-bold">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.type}</p>
                    </div>
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {slot.durationMin}m
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{coach}</span>
                    <span className="flex items-center gap-1 font-mono-num">
                      <Users className="h-3 w-3" />
                      {count}/{cap}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <ClassDialog
        open={!!openClass}
        onOpenChange={(o) => !o && setOpenClass(null)}
        date={openClass?.date ?? null}
        slot={openClass?.slot ?? null}
        roster={athletes}
      />
    </div>
  );
}

function ClassDialog({
  open,
  onOpenChange,
  date,
  slot,
  roster,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date | null;
  slot: ClassSlot | null;
  roster: GymAthlete[];
}) {
  if (!date || !slot) return null;
  const seed = `${dayKey(date)}:${slot.key}`;
  const coach = COACH_POOL[seededHash(seed) % COACH_POOL.length];
  const cap = 16;
  const count = 4 + (seededHash(seed + ":n") % 11);
  const realPick = seededSample(roster, Math.min(count, roster.length), seed);
  const fillerNeeded = Math.max(0, count - realPick.length);
  const fillerPick = seededSample(FILLER_NAMES, fillerNeeded, seed + ":fill").map((name, i) => ({
    id: `fill-${i}`,
    name,
  }));
  const attendees = [...realPick, ...fillerPick];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2">
            <span className="font-mono-num">{slot.label}</span>
            <span className="text-sm font-medium text-muted-foreground">{slot.type}</span>
          </DialogTitle>
          <DialogDescription>
            {format(date, "EEEE, MMM d, yyyy")} · {slot.durationMin} minutes
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <p className="eyebrow">Coach</p>
          <p className="mt-1 text-base font-bold">{coach}</p>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="eyebrow">Roster</p>
            <span className="font-mono-num text-xs text-muted-foreground">
              {count} / {cap} booked
            </span>
          </div>
          <ul className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {attendees.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {a.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="truncate text-sm">{a.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
