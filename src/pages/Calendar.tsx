import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Clock, Flame, Trophy, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProgrammingWeek, type WeekWod } from "@/hooks/useProgrammingWeek";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { GroupBlockCard } from "@/components/workout/GroupBlockCard";
import { CollapsibleWorkoutSegment } from "@/components/workout/CollapsibleWorkoutSegment";
import {
  buildWorkoutDayBlocks,
  groupScoreForBlock,
} from "@/lib/programming/workout-segment-groups";
import type { WorkoutDayProgramming, WorkoutLineItem } from "@/hooks/useWorkoutDay";
import type { LogLineItem } from "@/components/rx/LogScoreSheet";
import {
  cancelClassCheckin,
  checkIntoClass,
  defaultClassesForDay,
  fetchGymDayCheckins,
  type ClassCheckin,
  type ClassSlot,
} from "@/lib/classes/class-checkin";
import { useScoreCheckinGate } from "@/components/classes/ClassCheckinPrompt";
import { toast } from "sonner";

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function weekWodToDayProgramming(w: WeekWod, items: LogLineItem[]): WorkoutDayProgramming {
  const lineItems: WorkoutLineItem[] = items.map((it) => ({
    ...it,
    programming_id: w.id,
    contact_id: null,
  }));
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    athlete_notes: w.athlete_notes,
    coaches_notes: w.coaches_notes,
    programming_segment: w.programming_segment,
    metcon_format: w.metcon_format,
    workout_scheme: w.workout_scheme,
    segment_group_id: w.segment_group_id ?? null,
    group_score_anchor: w.group_score_anchor ?? false,
    programming_subtype: w.programming_subtype ?? null,
    display_order: w.display_order,
    wod_date: w.wod_date,
    prescribed_scale: w.prescribed_scale ?? null,
    source: w.source,
    items: lineItems,
  };
}

export default function CalendarPage() {
  const { contactId, activeGymId, mode, rxGender, displayName } = useAuth();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selected, setSelected] = useState<Date>(new Date());
  const [openClass, setOpenClass] = useState<{ date: Date; slot: ClassSlot } | null>(null);
  const [dayCheckins, setDayCheckins] = useState<ClassCheckin[]>([]);
  const [checkinBusy, setCheckinBusy] = useState(false);

  const { data, isLoading, error, refetch } = useProgrammingWeek(activeGymId, contactId, weekStart);
  const { wods, itemsByWod, perfByItem, perfBySegment, perfByGroup, athletes } = data;

  const selectedKey = dayKey(selected);
  const { wrapOnLogged, prompt: checkinPrompt } = useScoreCheckinGate(
    activeGymId,
    contactId,
    selectedKey,
    refetch,
  );

  const reloadDayCheckins = useCallback(async () => {
    if (!activeGymId) {
      setDayCheckins([]);
      return;
    }
    try {
      setDayCheckins(await fetchGymDayCheckins(activeGymId, selectedKey));
    } catch {
      setDayCheckins([]);
    }
  }, [activeGymId, selectedKey]);

  useEffect(() => {
    void reloadDayCheckins();
  }, [reloadDayCheckins]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const wodsByDay = useMemo(() => {
    const m = new Map<string, typeof wods>();
    for (const w of wods) {
      const arr = m.get(w.wod_date) ?? [];
      arr.push(w);
      m.set(w.wod_date, arr);
    }
    return m;
  }, [wods]);

  const selectedWods = wodsByDay.get(selectedKey) ?? [];
  const selectedDayProgramming = useMemo(
    () => selectedWods.map((w) => weekWodToDayProgramming(w, itemsByWod.get(w.id) ?? [])),
    [selectedWods, itemsByWod],
  );
  const selectedBlocks = useMemo(
    () => buildWorkoutDayBlocks(selectedDayProgramming),
    [selectedDayProgramming],
  );
  const selectedClasses = defaultClassesForDay(selected);
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;
  const blockCount = selectedBlocks.length;

  const myCheckinByTime = useMemo(() => {
    const m = new Map<string, ClassCheckin>();
    if (!contactId) return m;
    for (const c of dayCheckins) {
      if (c.contact_id === contactId) m.set(c.start_time, c);
    }
    return m;
  }, [dayCheckins, contactId]);

  const countByTime = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of dayCheckins) {
      m.set(c.start_time, (m.get(c.start_time) ?? 0) + 1);
    }
    return m;
  }, [dayCheckins]);

  async function toggleCheckin(slot: ClassSlot) {
    if (!activeGymId || !contactId) {
      toast.error("Sign in and join a gym to check in");
      return;
    }
    setCheckinBusy(true);
    const existing = myCheckinByTime.get(slot.time);
    if (existing) {
      const { error: err } = await cancelClassCheckin(existing.id);
      setCheckinBusy(false);
      if (err) {
        toast.error("Couldn't leave class", { description: err });
        return;
      }
      toast.success(`Left ${slot.label}`);
    } else {
      const { error: err } = await checkIntoClass({
        gymId: activeGymId,
        contactId,
        dateKey: selectedKey,
        slot,
      });
      setCheckinBusy(false);
      if (err) {
        toast.error("Couldn't check in", { description: err });
        return;
      }
      toast.success(`Checked in · ${slot.label}`);
    }
    await reloadDayCheckins();
  }

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
          Tap a class time to check in. Log scores from Today or below — you'll be asked for a class
          if you haven't checked in yet.
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
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight">{format(selected, "EEEE, MMM d")}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedClasses.length} classes · {blockCount} workout
              {blockCount === 1 ? "" : "s"}
            </span>
            <Button asChild variant="secondary" size="sm" className="h-8 gap-1 text-xs">
              <Link to={`/leaderboard?date=${selectedKey}`}>
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>

        <section className="space-y-3">
          <p className="eyebrow flex items-center gap-1.5">
            <Flame className="h-3 w-3" /> Programming
          </p>
          {isLoading && <PageSkeleton rows={2} />}
          {!isLoading && !error && selectedBlocks.length === 0 && (
            <EmptyState
              title="No workout published yet"
              description={`Nothing published for ${format(selected, "EEE, MMM d")}.`}
            />
          )}
          {!isLoading && !error && selectedBlocks.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {selectedBlocks.map((block) => {
                if (block.kind === "group") {
                  const groupPerf = groupScoreForBlock(block, perfByGroup);
                  return (
                    <GroupBlockCard
                      key={block.groupId}
                      block={block}
                      wodDate={selectedKey}
                      contactId={contactId}
                      rxGender={rxGender}
                      perfByItem={perfByItem}
                      perfBySegment={perfBySegment}
                      groupPerf={groupPerf}
                      isComplete={!!groupPerf?.score}
                      onLogged={wrapOnLogged}
                    />
                  );
                }

                const w = block.wod;
                return (
                  <Card key={w.id} className="glass-card overflow-hidden p-0">
                    <CollapsibleWorkoutSegment
                      wod={w}
                      items={w.items}
                      contactId={contactId}
                      rxGender={rxGender}
                      perfByItem={perfByItem}
                      segmentPerf={perfBySegment.get(w.id) ?? null}
                      isComplete={!!perfBySegment.get(w.id)?.score}
                      onLogged={wrapOnLogged}
                    />
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
              const mine = myCheckinByTime.get(slot.time);
              const count = countByTime.get(slot.time) ?? 0;
              return (
                <div
                  key={slot.key}
                  className={cn(
                    "rounded-[var(--radius)] border bg-card/80 p-4 text-left transition-colors",
                    mine ? "border-primary/50 bg-primary/5" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setOpenClass({ date: selected, slot })}
                    >
                      <p className="font-mono-num text-base font-bold">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.type}</p>
                    </button>
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {slot.durationMin}m
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setOpenClass({ date: selected, slot })}
                    >
                      <Users className="h-3 w-3" />
                      <span className="font-mono-num">{count} checked in</span>
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant={mine ? "secondary" : "default"}
                      disabled={checkinBusy || !contactId}
                      className="h-8 gap-1 text-xs"
                      onClick={() => void toggleCheckin(slot)}
                    >
                      {mine ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> In
                        </>
                      ) : (
                        "Check in"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <ClassRosterDialog
        open={!!openClass}
        onOpenChange={(o) => !o && setOpenClass(null)}
        date={openClass?.date ?? null}
        slot={openClass?.slot ?? null}
        checkins={dayCheckins}
        athletes={athletes}
        myName={displayName}
      />
      {checkinPrompt}
    </div>
  );
}

function ClassRosterDialog({
  open,
  onOpenChange,
  date,
  slot,
  checkins,
  athletes,
  myName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date | null;
  slot: ClassSlot | null;
  checkins: ClassCheckin[];
  athletes: { id: string; name: string }[];
  myName: string | null;
}) {
  if (!date || !slot) return null;
  const nameById = new Map(athletes.map((a) => [a.id, a.name]));
  const attendees = checkins
    .filter((c) => c.start_time === slot.time)
    .map((c) => ({
      id: c.contact_id,
      name: nameById.get(c.contact_id) ?? myName ?? "Athlete",
    }));

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
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="eyebrow">Checked in</p>
            <span className="font-mono-num text-xs text-muted-foreground">{attendees.length}</span>
          </div>
          {attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one checked in yet. Be the first.</p>
          ) : (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
