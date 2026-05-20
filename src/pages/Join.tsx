import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

type Option = {
  membership_offering_term_id: string;
  membership_offering_id: string;
  offering_name: string;
  description: string | null;
  term_months: number;
  price_cents: number;
  commitment_total_cents: number;
  currency: string;
  billing_type: string;
  included_program_libraries: { program_library_id: string; name: string }[];
  included_capabilities: string[];
};

type LinkInfo = {
  link_id: string;
  gym_id: string;
  gym_name: string;
  label: string | null;
  options: Option[];
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function JoinPage() {
  const { linkId } = useParams();
  const { user, loading: authLoading, refresh } = useAuth();
  const nav = useNavigate();
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!linkId) return;
      const { data, error } = await supabase.rpc("get_fitness_track_link_public", {
        p_link_id: linkId,
      });
      if (error || !data) {
        toast.error("This invite link is invalid or expired.");
        setInfo(null);
      } else {
        setInfo(data as unknown as LinkInfo);
      }
      setLoading(false);
    })();
  }, [linkId]);

  async function claim(termId: string) {
    if (!linkId) return;
    if (!user) {
      // Bounce through auth then come back
      nav(`/auth?next=${encodeURIComponent(`/join/${linkId}`)}`);
      return;
    }
    setClaiming(termId);
    const { error } = await supabase.rpc("claim_fitness_track_link", {
      p_link_id: linkId,
      p_membership_offering_term_id: termId,
    });
    setClaiming(null);
    if (error) {
      toast.error("Couldn't claim membership", { description: error.message });
      return;
    }
    toast.success("You're in! 🎉", { description: `Welcome to ${info?.gym_name}.` });
    await refresh();
    nav("/");
  }

  return (
    <div
      className="grid min-h-screen place-items-start px-4 py-10"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <p className="eyebrow">Gym invitation</p>
          {loading || authLoading ? (
            <Skeleton className="mx-auto mt-2 h-9 w-64" />
          ) : info ? (
            <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">{info.gym_name}</h1>
          ) : (
            <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Link not available</h1>
          )}
          {info?.label && <p className="mt-1 text-sm text-muted-foreground">{info.label}</p>}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : !info ? (
          <Card className="glass-card p-6 text-center text-muted-foreground">
            Ask the gym for a fresh invite link.
          </Card>
        ) : info.options.length === 0 ? (
          <Card className="glass-card p-6 text-center text-muted-foreground">
            No membership options are attached to this link yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {info.options.map((opt) => (
              <Card key={opt.membership_offering_term_id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold leading-tight">{opt.offering_name}</h3>
                    {opt.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num text-2xl font-black neon-text">
                      {money(opt.price_cents, opt.currency)}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      / mo · {opt.term_months}mo term
                    </p>
                  </div>
                </div>

                {(opt.included_program_libraries.length > 0 || opt.included_capabilities.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {opt.included_program_libraries.map((pl) => (
                      <Badge key={pl.program_library_id} variant="secondary" className="text-[10px]">
                        {pl.name}
                      </Badge>
                    ))}
                    {opt.included_capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-[10px]">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => claim(opt.membership_offering_term_id)}
                  disabled={claiming !== null}
                  size="lg"
                  className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {claiming === opt.membership_offering_term_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : user ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Claim membership
                    </>
                  ) : (
                    "Sign in to claim"
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
