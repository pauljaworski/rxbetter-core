import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
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
  const { data, isLoading, error, isEmpty, refetch } = useWorkoutDay(activeGymId, contactId);
  const { data: libraries } = useProgramLibraries(activeGymId);
  const [viewScale, setViewScale] = useState<WorkoutScale | null>(null);
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const dateLabel = useMemo(() => data.wodDate, [data.wodDate]);
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

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const showTrackFilter = dayTracks.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
          <Link to={`/leaderboard?date=${todayKey}`}>
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
          description={dateLabel ? `Nothing scheduled for ${dateLabel}.` : "No class programming published yet."}
        />
      )}
      {!isLoading && !error && !isEmpty && visibleWods.length === 0 && (
        <EmptyState
          title="Nothing on this track"
          description="Try All tracks, or pick another program for today."
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
        />
      )}
    </div>
  );
}
