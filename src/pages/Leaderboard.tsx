import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLeaderboard,
  type GenderFilter,
  type LevelFilter,
} from "@/hooks/useLeaderboard";
import { LeaderboardFilters } from "@/components/leaderboard/LeaderboardFilters";
import { LeaderboardEntryCard } from "@/components/leaderboard/LeaderboardEntryCard";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function parseDateParam(raw: string | null): Date {
  if (!raw) return new Date();
  const d = parseISO(raw);
  return isValid(d) ? d : new Date();
}

export default function Leaderboard() {
  const { activeGymId, contactId, mode, memberships } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gender, setGender] = useState<GenderFilter>("both");
  const [level, setLevel] = useState<LevelFilter>("all");

  const date = useMemo(
    () => parseDateParam(searchParams.get("date")),
    [searchParams],
  );
  const dateKey = format(date, "yyyy-MM-dd");

  const { data, isLoading, error, refetch } = useLeaderboard(
    activeGymId,
    contactId,
    date,
    gender,
    level,
  );

  const gymName = memberships.find((m) => m.gym_id === activeGymId)?.gym_name;

  function shiftDay(delta: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setSearchParams({ date: format(next, "yyyy-MM-dd") });
  }

  function setDateInput(value: string) {
    if (!value) return;
    setSearchParams({ date: value });
  }

  if (mode === "personal") {
    return (
      <EmptyState
        title="Leaderboard requires a gym"
        description="Join a gym to compete on the daily leaderboard."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6">
        <div className="relative z-10">
          <p className="eyebrow flex items-center gap-1.5 text-primary">
            <Trophy className="h-3.5 w-3.5" />
            {gymName ?? "Gym"} Leaderboard
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
            Who crushed it today?
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Rankings by WOD · filter by gender and Rx level · like and comment on scores.
          </p>
        </div>
        <Trophy className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-primary/10" />
      </header>

      <Card className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="icon" variant="ghost" onClick={() => shiftDay(-1)} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={dateKey}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-auto font-mono-num text-sm"
          />
          <Button type="button" size="icon" variant="ghost" onClick={() => shiftDay(1)} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" className="ml-auto" asChild>
            <Link to={`/leaderboard?date=${format(new Date(), "yyyy-MM-dd")}`}>Today</Link>
          </Button>
        </div>
        <div className="mt-4 border-t border-border/60 pt-4">
          <LeaderboardFilters
            gender={gender}
            level={level}
            levels={data.levels}
            onGenderChange={setGender}
            onLevelChange={setLevel}
          />
        </div>
      </Card>

      {error && <ErrorBanner message={error} />}
      {isLoading && <PageSkeleton rows={4} />}

      {!isLoading && !error && data.boards.length === 0 && (
        <EmptyState
          title="No scores yet"
          description={`No logged results for ${format(date, "MMM d, yyyy")} with the current filters. Be the first on the board!`}
          actionLabel="Log today's workout"
          onAction={() => {
            window.location.href = "/";
          }}
        />
      )}

      {!isLoading &&
        !error &&
        data.boards.map((board) => (
          <section key={`${board.programmingId}-${board.subtitle}`} className="space-y-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{board.title}</h2>
              {board.subtitle && (
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {board.subtitle}
                </p>
              )}
            </div>
            <div className="grid gap-3">
              {board.entries.map((entry) => (
                <LeaderboardEntryCard
                  key={entry.performanceId}
                  entry={entry}
                  gymId={activeGymId!}
                  contactId={contactId}
                  showScale={level === "all"}
                  onSocialChange={() => void refetch()}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
