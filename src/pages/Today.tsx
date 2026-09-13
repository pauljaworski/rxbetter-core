import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addDays, format, isSameDay, parseISO } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Today() {
  const { contactId, displayName, activeGymId, mode, rxGender, defaultWorkoutScale } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isViewingToday = isSameDay(selectedDate, new Date());

  const { data, isLoading, error, isEmpty, refetch } = useWorkoutDay(
    activeGymId,
    contactId,
    dateKey,
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
            <label className="relative flex cursor-pointer items-center gap-1.5 px-1">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold tabular-nums">
                {format(selectedDate, "MMM d")}
              </span>
              <Input
                type="date"
                value={dateKey}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setSelectedDate(parseISO(e.target.value));
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Pick a date"
              />
            </label>
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
                onClick={() => setSelectedDate(new Date())}
              >
                Today
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
          title="No programming"
          description={`Nothing scheduled for ${format(selectedDate, "EEEE, MMM d")}.`}
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
          onLogged={refetch}
          viewingToday={isViewingToday}
        />
      )}
    </div>
  );
}
