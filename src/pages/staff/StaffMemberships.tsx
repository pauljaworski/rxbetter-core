import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Link2, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Offering = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  terms: { id: string; term_months: number; price_cents: number; currency: string }[];
};

type TrackLink = {
  id: string;
  label: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  options: number;
};

export default function StaffMemberships() {
  const { activeGymId } = useAuth();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [links, setLinks] = useState<TrackLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGymId) return;
    void (async () => {
      setLoading(true);
      const { data: offs } = await supabase
        .from("membership_offering")
        .select("id, name, description, is_active")
        .eq("gym_id", activeGymId)
        .order("name");
      const offIds = (offs ?? []).map((o) => o.id);
      const { data: terms } = offIds.length
        ? await supabase
            .from("membership_offering_term")
            .select("id, membership_offering_id, term_months, price_cents, currency")
            .in("membership_offering_id", offIds)
        : { data: [] as any[] };
      setOfferings(
        (offs ?? []).map((o) => ({
          ...o,
          terms: (terms ?? [])
            .filter((t: any) => t.membership_offering_id === o.id)
            .map((t: any) => ({
              id: t.id,
              term_months: t.term_months,
              price_cents: t.price_cents,
              currency: t.currency,
            })),
        })),
      );

      const { data: ls } = await supabase
        .from("fitness_track_link")
        .select("id, label, expires_at, revoked_at, max_redemptions, redemption_count")
        .eq("gym_id", activeGymId)
        .order("created_at", { ascending: false });
      const linkIds = (ls ?? []).map((l) => l.id);
      const { data: opts } = linkIds.length
        ? await supabase
            .from("fitness_track_link_option")
            .select("link_id")
            .in("link_id", linkIds)
        : { data: [] as any[] };
      const optCount = new Map<string, number>();
      for (const o of opts ?? []) {
        optCount.set(o.link_id as string, (optCount.get(o.link_id as string) ?? 0) + 1);
      }
      setLinks((ls ?? []).map((l) => ({ ...l, options: optCount.get(l.id) ?? 0 })));
      setLoading(false);
    })();
  }, [activeGymId]);

  function copyJoinUrl(id: string) {
    const url = `${window.location.origin}/join/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Copied join link", { description: url });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Admin</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Memberships</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Offerings, terms, and shareable join links for new athletes.
        </p>
      </header>

      <Tabs defaultValue="offerings">
        <TabsList>
          <TabsTrigger value="offerings">Offerings</TabsTrigger>
          <TabsTrigger value="links">Join links</TabsTrigger>
        </TabsList>

        <TabsContent value="offerings" className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : offerings.length === 0 ? (
            <Card className="glass-card p-6 text-sm text-muted-foreground">
              No offerings yet. Create one to start selling memberships.
            </Card>
          ) : (
            offerings.map((o) => (
              <Card key={o.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <h3 className="text-base font-bold">{o.name}</h3>
                      {!o.is_active && (
                        <Badge variant="outline" className="text-[10px] uppercase">
                          inactive
                        </Badge>
                      )}
                    </div>
                    {o.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
                    )}
                  </div>
                </div>
                {o.terms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.terms.map((t) => (
                      <div
                        key={t.id}
                        className="font-mono-num rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs"
                      >
                        {t.term_months}mo ·{" "}
                        <span className="font-bold">
                          {(t.price_cents / 100).toLocaleString(undefined, {
                            style: "currency",
                            currency: t.currency,
                          })}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="links" className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : links.length === 0 ? (
            <Card className="glass-card p-6 text-sm text-muted-foreground">
              No track links yet. Create one to onboard new athletes via /join/&lt;id&gt;.
            </Card>
          ) : (
            links.map((l) => {
              const expired = l.expires_at && new Date(l.expires_at) < new Date();
              const revoked = !!l.revoked_at;
              const live = !expired && !revoked;
              return (
                <Card key={l.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary" />
                        <p className="truncate text-sm font-bold">{l.label ?? "Untitled link"}</p>
                        <Badge
                          variant="outline"
                          className={
                            live
                              ? "border-primary/50 text-primary"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {revoked ? "revoked" : expired ? "expired" : "live"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        /join/{l.id}
                      </p>
                      <div className="font-mono-num mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>
                          {l.redemption_count}
                          {l.max_redemptions ? `/${l.max_redemptions}` : ""} claimed
                        </span>
                        <span>{l.options} option{l.options === 1 ? "" : "s"}</span>
                        {l.expires_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(l.expires_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyJoinUrl(l.id)}>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
