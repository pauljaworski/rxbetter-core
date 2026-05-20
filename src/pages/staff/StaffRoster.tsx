import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, Shield } from "lucide-react";

type Member = {
  contact_id: string;
  name: string;
  email: string | null;
  roles: string[];
  subs: number;
};

export default function StaffRoster() {
  const { activeGymId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!activeGymId) return;
    void (async () => {
      setLoading(true);
      const { data: fm } = await supabase
        .from("fitness_membership")
        .select("contact_id, role")
        .eq("gym_id", activeGymId)
        .eq("membership_status", "active");
      const byContact = new Map<string, Set<string>>();
      for (const m of fm ?? []) {
        const s = byContact.get(m.contact_id) ?? new Set<string>();
        if (m.role) s.add(m.role);
        byContact.set(m.contact_id, s);
      }
      const contactIds = Array.from(byContact.keys());
      const [contactsRes, subsRes] = await Promise.all([
        contactIds.length
          ? supabase.from("contact").select("id, first_name, last_name, email").in("id", contactIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("athlete_subscription")
          .select("contact_id")
          .eq("gym_id", activeGymId)
          .eq("status", "active"),
      ]);
      const subCount = new Map<string, number>();
      for (const s of subsRes.data ?? []) {
        subCount.set(s.contact_id as string, (subCount.get(s.contact_id as string) ?? 0) + 1);
      }
      const list: Member[] = (contactsRes.data ?? []).map((c: any) => ({
        contact_id: c.id,
        name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "—",
        email: c.email,
        roles: Array.from(byContact.get(c.id) ?? []),
        subs: subCount.get(c.id) ?? 0,
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(list);
      setLoading(false);
    })();
  }, [activeGymId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(
      (m) => m.name.toLowerCase().includes(needle) || (m.email ?? "").toLowerCase().includes(needle),
    );
  }, [members, q]);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Members</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">Roster</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone with an active membership. Subscriptions are read-only here; admins manage them in
          Memberships.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass-card p-6 text-center text-sm text-muted-foreground">No members.</Card>
      ) : (
        <Card className="glass-card overflow-hidden p-0">
          <div className="divide-y divide-border/60">
            {filtered.map((m) => (
              <div
                key={m.contact_id}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold uppercase">
                    {m.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{m.name}</p>
                    {m.email && (
                      <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <Mail className="h-3 w-3" /> {m.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.roles.map((r) => (
                    <Badge
                      key={r}
                      variant="outline"
                      className="border-border bg-secondary/50 text-[10px] uppercase tracking-wider"
                    >
                      {r === "admin" || r === "programmer" || r === "coach" ? (
                        <Shield className="mr-1 h-2.5 w-2.5" />
                      ) : null}
                      {r}
                    </Badge>
                  ))}
                  <span className="font-mono-num rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {m.subs} sub{m.subs === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
