import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutDay } from "@/hooks/useWorkoutDay";
import { WorkoutDayView } from "@/components/workout/WorkoutDayView";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";

export default function Today() {
  const { contactId, displayName, activeGymId, mode } = useAuth();
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

  return (
    <div className="space-y-6">
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
          contactId={contactId}
          displayName={displayName}
          onLogged={refetch}
        />
      )}
    </div>
  );
}
