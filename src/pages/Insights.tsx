import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/layout/EmptyState";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/athlete-insights`;

export default function Insights() {
  const { contactId, session, activeGymId, mode } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!contactId) {
      toast.error("Sign in to generate insights");
      return;
    }
    if (!activeGymId) {
      toast.error("Select a gym", { description: "Insights use your gym's upcoming programming." });
      return;
    }
    setText("");
    setDone(false);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const resp = await fetch(FN_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ contact_id: contactId, gym_id: activeGymId }),
      });
      if (resp.status === 429) {
        const errBody = await resp.json().catch(() => ({}));
        toast.error("Rate limit reached", {
          description: (errBody as { error?: string }).error ?? "Try again in a moment.",
        });
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let streamDone = false;
      while (!streamDone) {
        const { done: rDone, value } = await reader.read();
        if (rDone) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(j);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) setText((t) => t + delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
      setDone(true);
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err.name !== "AbortError") {
        console.error(e);
        toast.error("Couldn't generate insight", { description: err.message });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  if (mode === "personal") {
    return (
      <EmptyState
        title="Insights need a gym"
        description="Join a gym via your coach's invite link so we can personalize upcoming programming."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header
        className="relative overflow-hidden rounded-[var(--radius)] border border-border p-6 md:p-8"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Smart Insights
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Your week, decoded.</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              An AI coach reads your last 30 days of work, surfaces what's trending, and tells you
              exactly where to push next — using your gym's upcoming programming.
            </p>
          </div>
        </div>
        <Button
          onClick={() => void generate()}
          disabled={loading || !activeGymId}
          size="lg"
          className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate weekly insight
            </>
          )}
        </Button>
      </header>

      {(text || loading) && (
        <Card className="glass-card-glow p-6 md:p-8">
          <p className="eyebrow mb-3">Coach's brief</p>
          <article className="prose prose-invert max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
            {text}
            {loading && !done && (
              <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
            )}
          </article>
        </Card>
      )}

      {!text && !loading && (
        <Card className="glass-card p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Tap &quot;Generate weekly insight&quot; to brief the AI on your training.
          </p>
        </Card>
      )}
    </div>
  );
}
