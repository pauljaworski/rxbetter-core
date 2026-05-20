import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Pencil,
  Search,
  Save,
  NotebookPen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { segmentLabel } from "@/lib/demo";

type Wod = {
  id: string;
  name: string | null;
  description: string | null;
  programming_segment: string | null;
  metcon_format: string | null;
  display_order: number | null;
  athlete_notes: string | null;
  coaches_notes: string | null;
};
type LineItem = {
  id: string;
  programming_id: string;
  sequence_number: number | null;
  reps_prescribed: number | null;
  prescribed_weight: number | null;
  prescribed_percentage: number | null;
  prescribed_score: string | null;
  benchmark_type_id: string | null;
  bench_name?: string | null;
};
type Perf = {
  id: string;
  contact_id: string;
  programming_id: string | null;
  programming_line_item_id: string | null;
  score: string | null;
  weight_lifted: number | null;
  rpe: number | null;
  is_pr: boolean;
};
type Contact = { id: string; name: string };

export default function StaffClassDay() {
  const { activeGymId, activePersona } = useAuth();
  const canEdit = activePersona === "admin";
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [wods, setWods] = useState<Wod[]>([]);
  const [itemsByWod, setItemsByWod] = useState<Map<string, LineItem[]>>(new Map());
  const [perfByItem, setPerfByItem] = useState<Map<string, Perf[]>>(new Map());
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map());
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{
    perf: Perf;
    item: LineItem;
    wod: Wod;
    contact: Contact;
  } | null>(null);

  async function load() {
    if (!activeGymId) return;
    setLoading(true);
    const dateKey = format(date, "yyyy-MM-dd");
    const { data: progs } = await supabase
      .from("programming")
      .select(
        "id, name, description, programming_segment, metcon_format, display_order, athlete_notes, coaches_notes",
      )
      .eq("gym_id", activeGymId)
      .eq("wod_date", dateKey)
      .order("display_order", { ascending: true });
    setWods((progs ?? []) as Wod[]);
    const ids = (progs ?? []).map((p) => p.id);

    if (!ids.length) {
      setItemsByWod(new Map());
      setPerfByItem(new Map());
      setContacts(new Map());
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("programming_line_item")
      .select(
        "id, programming_id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id",
      )
      .in("programming_id", ids)
      .order("sequence_number");
    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await supabase.from("benchmark_type").select("id, name").in("id", typeIds)
      : { data: [] as any[] };
    const typeMap = new Map((types ?? []).map((t: any) => [t.id, t.name]));
    const iMap = new Map<string, LineItem[]>();
    for (const it of items ?? []) {
      const enriched: LineItem = { ...(it as any), bench_name: typeMap.get(it.benchmark_type_id as string) };
      const arr = iMap.get(it.programming_id) ?? [];
      arr.push(enriched);
      iMap.set(it.programming_id, arr);
    }
    setItemsByWod(iMap);

    const { data: perfs } = await supabase
      .from("athlete_performance")
      .select(
        "id, contact_id, programming_id, programming_line_item_id, score, weight_lifted, rpe, is_pr",
      )
      .in("programming_id", ids);
    const pMap = new Map<string, Perf[]>();
    for (const p of perfs ?? []) {
      if (!p.programming_line_item_id) continue;
      const arr = pMap.get(p.programming_line_item_id) ?? [];
      arr.push(p as Perf);
      pMap.set(p.programming_line_item_id, arr);
    }
    setPerfByItem(pMap);

    const contactIds = Array.from(new Set((perfs ?? []).map((p) => p.contact_id)));
    const { data: cs } = contactIds.length
      ? await supabase.from("contact").select("id, first_name, last_name").in("id", contactIds)
      : { data: [] as any[] };
    const cMap = new Map<string, Contact>();
    for (const c of cs ?? []) {
      cMap.set(c.id, {
        id: c.id,
        name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "Athlete",
      });
    }
    setContacts(cMap);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGymId, date]);

  const totalLogged = useMemo(() => {
    let n = 0;
    for (const arr of perfByItem.values()) n += arr.length;
    return n;
  }, [perfByItem]);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Class day</p>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">{format(date, "EEEE, MMM d")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See every score logged for today's programming. {canEdit ? "Tap any row to edit." : "Read-only for your role."}
        </p>
      </header>

      <Card className="glass-card flex items-center justify-between p-2">
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-mono-num text-sm font-bold">{format(date, "EEE, MMM d, yyyy")}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {wods.length} WOD{wods.length === 1 ? "" : "s"} · {totalLogged} score{totalLogged === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter athletes by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : wods.length === 0 ? (
        <Card className="glass-card p-8 text-center text-sm text-muted-foreground">
          No programming for this day.
        </Card>
      ) : (
        wods.map((w) => (
          <Card key={w.id} className="glass-card overflow-hidden p-0">
            <div className="border-b border-border/60 bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="eyebrow">
                    {segmentLabel(w.programming_segment)}
                    {w.metcon_format ? ` · ${w.metcon_format.toUpperCase()}` : ""}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold leading-tight">{w.name ?? "Untitled"}</h3>
                </div>
              </div>
              {w.coaches_notes && (
                <p className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
                  <NotebookPen className="mt-0.5 h-3 w-3 shrink-0" />
                  {w.coaches_notes}
                </p>
              )}
            </div>
            <div className="divide-y divide-border/60">
              {(itemsByWod.get(w.id) ?? []).length === 0 && (
                <div className="p-5 text-sm text-muted-foreground">No prescribed sets.</div>
              )}
              {(itemsByWod.get(w.id) ?? []).map((it) => {
                const perfs = (perfByItem.get(it.id) ?? []).filter((p) => {
                  if (!search) return true;
                  const c = contacts.get(p.contact_id);
                  return c?.name.toLowerCase().includes(search.toLowerCase());
                });
                return (
                  <div key={it.id} className="p-4">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num inline-grid h-6 w-6 place-items-center rounded-md bg-secondary text-[11px] font-bold text-muted-foreground">
                          {it.sequence_number ?? "·"}
                        </span>
                        <p className="text-sm font-bold">{it.bench_name ?? "Set"}</p>
                      </div>
                      <p className="font-mono-num text-[11px] text-muted-foreground">
                        {perfs.length} logged
                      </p>
                    </div>
                    {perfs.length === 0 ? (
                      <p className="pl-8 text-[11px] italic text-muted-foreground">No scores yet.</p>
                    ) : (
                      <ul className="space-y-1 pl-8">
                        {perfs.map((p) => {
                          const c = contacts.get(p.contact_id);
                          const display =
                            p.weight_lifted != null
                              ? `${p.weight_lifted} lb`
                              : p.score ?? "—";
                          return (
                            <li
                              key={p.id}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                                canEdit && "cursor-pointer hover:bg-secondary/60",
                              )}
                              onClick={() =>
                                canEdit &&
                                c &&
                                setEditing({ perf: p, item: it, wod: w, contact: c })
                              }
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold uppercase">
                                  {c?.name
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("") ?? "—"}
                                </div>
                                <span className="truncate font-medium">{c?.name ?? "Athlete"}</span>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {p.rpe != null && (
                                  <span className="font-mono-num text-[10px] text-muted-foreground">
                                    RPE {p.rpe}
                                  </span>
                                )}
                                {p.is_pr && (
                                  <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                                    <Flame className="h-3 w-3" /> PR
                                  </Badge>
                                )}
                                <span className="font-mono-num text-sm font-bold text-primary">
                                  {display}
                                </span>
                                {canEdit && (
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}

      <EditScoreSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void load();
        }}
      />
    </div>
  );
}

function EditScoreSheet({
  editing,
  onClose,
  onSaved,
}: {
  editing: { perf: Perf; item: LineItem; wod: Wod; contact: Contact } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [score, setScore] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setScore(editing.perf.score ?? "");
    setWeight(editing.perf.weight_lifted != null ? String(editing.perf.weight_lifted) : "");
    setRpe(editing.perf.rpe != null ? String(editing.perf.rpe) : "");
  }, [editing]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    const wNum = weight ? Number(weight) : null;
    const rNum = rpe ? Number(rpe) : null;
    const { error } = await supabase
      .from("athlete_performance")
      .update({
        score: score || null,
        weight_lifted: wNum,
        result_value: wNum,
        rpe: rNum,
      })
      .eq("id", editing.perf.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't update score", { description: error.message });
      return;
    }
    toast.success(`Updated ${editing.contact.name}'s score`);
    onSaved();
  }

  return (
    <Sheet open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="border-border bg-card">
        <SheetHeader>
          <SheetTitle>
            {editing ? `${editing.contact.name} · ${editing.item.bench_name ?? "Set"}` : ""}
          </SheetTitle>
        </SheetHeader>
        {editing && (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Weight (lb)</Label>
              <Input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="font-mono-num text-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Score / time / rounds</Label>
              <Input
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="font-mono-num"
                placeholder="e.g. 8:42"
              />
            </div>
            <div className="space-y-2">
              <Label>RPE (1–10)</Label>
              <Input
                inputMode="decimal"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="font-mono-num"
              />
            </div>
            <Button
              onClick={save}
              disabled={busy}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" /> {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
