import { useState } from "react";
import { Sparkles, Loader2, Target, Timer, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type MetconStrategy = {
  headline: string | null;
  scale_suggestion: string;
  pacing: string;
  breakdown: string[];
  targets: { movement?: string; note?: string }[];
  risk: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmingId: string | null;
  workoutName?: string | null;
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/metcon-strategy`;

export function MetconStrategySheet({ open, onOpenChange, programmingId, workoutName }: Props) {
  const { contactId, activeGymId, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<MetconStrategy | null>(null);

  async function generate() {
    if (!contactId || !activeGymId || !programmingId) {
      toast.error("Sign in and select a gym to get a strategy");
      return;
    }
    setLoading(true);
    setStrategy(null);
    try {
      const resp = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          programming_id: programmingId,
          gym_id: activeGymId,
          contact_id: contactId,
        }),
      });
      const data = (await resp.json()) as { error?: string; strategy?: MetconStrategy };
      if (resp.status === 429) {
        toast.error("Rate limit reached", { description: data.error });
        return;
      }
      if (!resp.ok || !data.strategy) {
        toast.error("Couldn't build strategy", { description: data.error ?? `HTTP ${resp.status}` });
        return;
      }
      setStrategy(data.strategy);
    } catch (e) {
      toast.error("Couldn't build strategy", {
        description: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      onOpenChange(false);
      return;
    }
    onOpenChange(true);
    if (!strategy && !loading) void generate();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto border-border bg-card pb-8">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            Strategy
          </SheetTitle>
          <SheetDescription>
            {workoutName ? `Game plan for ${workoutName}` : "Pacing and breakdown for this metcon"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Building your strategy…
            </div>
          )}

          {!loading && strategy && (
            <>
              {strategy.headline && (
                <p className="text-base font-semibold leading-snug text-foreground">{strategy.headline}</p>
              )}

              {strategy.scale_suggestion && (
                <section className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <p className="eyebrow flex items-center gap-1">
                    <Target className="h-3 w-3" /> Scale &amp; loads
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">{strategy.scale_suggestion}</p>
                </section>
              )}

              {strategy.pacing && (
                <section className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <p className="eyebrow flex items-center gap-1">
                    <Timer className="h-3 w-3" /> Pacing
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">{strategy.pacing}</p>
                </section>
              )}

              {strategy.breakdown.length > 0 && (
                <section>
                  <p className="eyebrow mb-2">Breakdown</p>
                  <ul className="space-y-1.5">
                    {strategy.breakdown.map((line, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {strategy.targets.length > 0 && (
                <section>
                  <p className="eyebrow mb-2">Movement targets</p>
                  <ul className="space-y-1.5">
                    {strategy.targets.map((t, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-semibold">{t.movement ?? "Movement"}</span>
                        {t.note ? <span className="text-muted-foreground"> — {t.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {strategy.risk && (
                <section className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
                  <p className="eyebrow flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> Watch out
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">{strategy.risk}</p>
                </section>
              )}

              <Button type="button" variant="secondary" size="sm" onClick={() => void generate()}>
                Regenerate
              </Button>
            </>
          )}

          {!loading && !strategy && (
            <Button type="button" onClick={() => void generate()} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Generate strategy
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
