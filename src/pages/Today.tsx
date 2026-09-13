import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { useProgramLibraries } from "@/hooks/useProgramLibraries";
import { WorkoutDayView } from "@/components/workout/WorkoutDayView";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RxGenderSelect } from "@/components/workout/RxGenderSelect";
import type { WorkoutScale } from "@/lib/format";
import {
  collectProgrammedScales,
  filterWodsByViewScalePreservingGroups,
  resolveDayViewScale,
} from "@/lib/programming/day-view-scale";
import { collectDayTracks, filterWodsByTrack } from "@/lib/programming/day-track-filter";
import { useScoreCheckinGate } from "@/components/classes/ClassCheckinPrompt";
import { cn } from "@/lib/utils";

function parseDateParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

export default function Today() {
  const { contactId, displayName, activeGymId, mode, rxGender, defaultWorkoutScale } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => {
    return parseDateParam(searchParams.get("date")) ?? startOfDay(new Date());
  });
  const [calOpen, setCalOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => selectedDate);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isViewingToday = isSameDay(selectedDate, new Date());

  useEffect(() => {
    if (calOpen) setCalendarMonth(selectedDate);
  }, [calOpen, selectedDate]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (isViewingToday) {
          if (!next.has("date")) return prev;
          next.delete("date");
          return next;
        }
        if (next.get("date") === dateKey) return prev;
        next.set("date", dateKey);
        return next;
      },
      { replace: true },
    );
  }, [dateKey, isViewingToday, setSearchParams]);

  const { data, isLoading, error, isEmpty, refetch } = useWorkoutDay(
    activeGymId,
    contactId,
    dateKey,
  );
  const { wrapOnLogged, prompt: checkinPrompt } = useScoreCheckinGate(
    activeGymId,
    contactId,
    dateKey,
    refetch,
  );
  const { data: libraries } = useProgramLibraries(activeGymId);
  const [viewScale, setViewScale] = useState<WorkoutScale | null>(null);
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const dayTracks = useMemo(
    () => collectDayTracks(data.wods, libraries),
    [data.wods, libraries],
  );
  const availableScales = useMemo(() => collectProgrammedScales(data.wods), [data.wods]);
  const effectiveScale = useMemo(
    () => resolveDayViewScale(viewScale, defaultWorkoutScale, availableScales),
    [viewScale, defaultWorkoutScale, availableScales],
  );
  const visibleWods = useMemo(() => {
    const byTrack = filterWodsByTrack(data.wods, trackFilter === "all" ? "all" : trackFilter);
    return filterWodsByViewScalePreservingGroups(byTrack, effectiveScale);
  }, [data.wods, trackFilter, effectiveScale]);

  if (mode === "personal") {
    return (
      <EmptyState
        title="Personal mode"
        description="You're not at a gym yet. Open your coach's invite link to join, or log PRs from the PRs tab."
        actionLabel="View PRs"
        onAction={() => {
          window.location.href = "/prs";
        }}
      />
    );
  }

  const showTrackFilter = dayTracks.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 p-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label="Previous day"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-8 gap-1.5 px-2 text-xs font-semibold tabular-nums",
                    !isViewingToday && "text-primary",
                  )}
                  aria-label="Pick a date"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {isViewingToday ? "Today" : format(selectedDate, "MMM d")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectedDate(startOfDay(d));
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label="Next day"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isViewingToday && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 px-2 text-xs"
                onClick={() => setSelectedDate(startOfDay(new Date()))}
              >
                Jump to today
              </Button>
            )}
          </div>
          <RxGenderSelect
            availableScales={availableScales}
            viewScale={viewScale}
            onViewScaleChange={setViewScale}
          />
          {showTrackFilter && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              <Label className="text-xs text-muted-foreground">Track</Label>
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="All tracks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tracks</SelectItem>
                  {dayTracks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button asChild variant="secondary" size="sm" className="gap-1.5">
          <Link to={`/leaderboard?date=${dateKey}`}>
            <Trophy className="h-4 w-4 text-primary" />
            Leaderboard
          </Link>
        </Button>
      </div>
      {isLoading && <PageSkeleton rows={2} />}
      {error && <ErrorBanner message={error} />}
      {!isLoading && !error && !activeGymId && (
        <Card className="glass-card p-8 text-center text-sm text-muted-foreground">
          Select a gym from the switcher, or open an invite link to join.
        </Card>
      )}
      {!isLoading && !error && activeGymId && isEmpty && (
        <EmptyState
          title="No workout published yet"
          description={`Nothing published for ${format(selectedDate, "EEEE, MMM d")}.`}
        />
      )}
      {!isLoading && !error && !isEmpty && visibleWods.length === 0 && (
        <EmptyState
          title="Nothing on this track"
          description="Try All tracks, or pick another program for this day."
        />
      )}
      {!isLoading && !error && visibleWods.length > 0 && (
        <WorkoutDayView
          wodDate={data.wodDate}
          wods={visibleWods}
          perfByItem={data.perfByItem}
          perfBySegment={data.perfBySegment}
          perfByGroup={data.perfByGroup}
          completions={data.completions}
          contactId={contactId}
          displayName={displayName}
          rxGender={rxGender}
          onLogged={wrapOnLogged}
          viewingToday={isViewingToday}
        />
      )}
      {checkinPrompt}
    </div>
  );
}
