import { useState } from "react";
import { format, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAthleteCustomWorkouts,
  useCreateAthleteCustomWorkout,
} from "@/hooks/useAthleteCustomWorkouts";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { segmentLabel } from "@/lib/format";

const SEGMENTS = [
  { value: "metcon", label: "Metcon" },
  { value: "strength", label: "Strength" },
  { value: "weightlifting", label: "Weightlifting" },
  { value: "accessory", label: "Accessory" },
  { value: "warmup", label: "Warm-up" },
];

export default function MyProgramming() {
  const { mode } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const dateKey = format(date, "yyyy-MM-dd");
  const { data: workouts, isLoading, error, refetch } = useAthleteCustomWorkouts(date);
  const { create, remove, busy } = useCreateAthleteCustomWorkout();

  const [name, setName] = useState("");
  const [segment, setSegment] = useState("metcon");
  const [notes, setNotes] = useState("");
  const [movements, setMovements] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give your workout a name");
      return;
    }
    const lines = movements
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const { error: err } = await create({
      wodDate: dateKey,
      name: name.trim(),
      segment,
      notes,
      movements: lines,
    });
    if (err) {
      toast.error("Couldn't save workout", { description: err });
      return;
    }
    toast.success("Workout added to your calendar");
    setName("");
    setNotes("");
    setMovements("");
    refetch();
  }

  async function handleDelete(id: string) {
    const { error: err } = await remove(id);
    if (err) {
      toast.error("Couldn't delete", { description: err });
      return;
    }
    toast.success("Workout removed");
    refetch();
  }

  if (mode === "personal") {
    return (
      <EmptyState
        title="Join a gym first"
        description="Personal workouts are available once you're a member at a gym."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="eyebrow">Personal training</p>
        <h1 className="text-3xl font-black tracking-tight">My programming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build your own sessions. They appear on your calendar and in history when you log scores —
          not on the gym&apos;s official programming board.
        </p>
      </header>

      <Card className="glass-card flex items-center justify-between p-2">
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-mono-num text-sm font-bold">{format(date, "EEE, MMM d, yyyy")}</p>
          <Button asChild variant="link" className="h-auto p-0 text-xs text-muted-foreground">
            <Link to={`/calendar`}>View on calendar</Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>

      {error && <ErrorBanner message={error} />}

      <Card className="glass-card p-5">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary" /> New workout
        </p>
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wod-name">Workout name</Label>
            <Input
              id="wod-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Garage AMRAP"
            />
          </div>
          <div className="space-y-2">
            <Label>Segment</Label>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="movements">Movements (one per line)</Label>
            <Textarea
              id="movements"
              value={movements}
              onChange={(e) => setMovements(e.target.value)}
              placeholder={"400m Run\n21 KB Swings\n12 Pull-ups"}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cap at 20 min, etc."
              rows={2}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Add to calendar"}
          </Button>
        </form>
      </Card>

      <section className="space-y-3">
        <p className="eyebrow flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" /> This day
        </p>
        {isLoading && <PageSkeleton rows={2} />}
        {!isLoading && !error && workouts.length === 0 && (
          <EmptyState
            title="No personal workouts"
            description="Create one above — it will show on Calendar for this date."
          />
        )}
        {workouts.map((w) => (
          <Card key={w.id} className="glass-card flex items-start justify-between gap-3 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{w.name ?? "Workout"}</h3>
                <Badge variant="secondary" className="text-[10px]">
                  Personal
                </Badge>
                {w.programming_segment && (
                  <Badge variant="outline" className="text-[10px]">
                    {segmentLabel(w.programming_segment)}
                  </Badge>
                )}
              </div>
              {w.athlete_notes && (
                <p className="mt-1 text-xs text-muted-foreground">{w.athlete_notes}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => void handleDelete(w.id)}
              aria-label="Delete workout"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
