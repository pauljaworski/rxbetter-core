import { useAuth } from "@/contexts/AuthContext";
import { useGymMemberships } from "@/hooks/staff/useGymMemberships";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorBanner } from "@/components/layout/ErrorBanner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Link2, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StaffMemberships() {
  const { activeGymId } = useAuth();
  const { data, isLoading, error } = useGymMemberships(activeGymId);
  const { offerings, links } = data;

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

      {error && <ErrorBanner message={error} />}

      <Tabs defaultValue="offerings">
        <TabsList>
          <TabsTrigger value="offerings">Offerings</TabsTrigger>
          <TabsTrigger value="links">Join links</TabsTrigger>
        </TabsList>

        <TabsContent value="offerings" className="mt-4 space-y-3">
          {isLoading && <PageSkeleton rows={2} />}
          {!isLoading && !error && offerings.length === 0 && (
            <EmptyState
              title="No offerings"
              description="Create a membership offering in Supabase or admin tools."
            />
          )}
          {!isLoading &&
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
            ))}
        </TabsContent>

        <TabsContent value="links" className="mt-4 space-y-3">
          {isLoading && <PageSkeleton rows={2} />}
          {!isLoading && !error && links.length === 0 && (
            <EmptyState
              title="No join links"
              description="Track links let athletes self-enroll at /join/your-link-id."
            />
          )}
          {!isLoading &&
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
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">/join/{l.id}</p>
                      <div className="font-mono-num mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>
                          {l.redemption_count}
                          {l.max_redemptions ? `/${l.max_redemptions}` : ""} claimed
                        </span>
                        <span>
                          {l.options} option{l.options === 1 ? "" : "s"}
                        </span>
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
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
