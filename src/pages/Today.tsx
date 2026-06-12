import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { WorkoutDayView } from "@/components/workout/WorkoutDayView";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RxGenderSelect } from "@/components/workout/RxGenderSelect";

export default function Today() {
  const { contactId, displayName, activeGymId, mode, rxGender } = useAuth();
  const { data, isLoading, error, isEmpty, refetch } = useWorkoutDay(activeGymId, contactId);

  const dateLabel = useMemo(() => data.wodDate, [data.wodDate]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RxGenderSelect />
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
      {!isLoading && !error && !isEmpty && (
        <WorkoutDayView
          wodDate={data.wodDate}
          wods={data.wods}
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
