import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { BenchmarkTypeOption } from "@/hooks/staff/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { filterBenchmarkCatalog } from "@/lib/programming/manual-config";

export type MovementPick =
  | { kind: "catalog"; bench: BenchmarkTypeOption }
  | { kind: "new"; label: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmingSegment: string;
  onPick: (pick: MovementPick) => void;
};

export function MovementPickerDialog({ open, onOpenChange, programmingSegment, onPick }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<BenchmarkTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (!open) {
      setQ("");
      setNewMode(false);
      setNewLabel("");
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const query = supabase
        .from("benchmark_type")
        .select("id, name, stimulus, sub_stimulus, purpose_variation")
        .order("name")
        .limit(80);
      if (q) query.ilike("name", `%${q}%`);
      const { data } = await query;
      if (!cancelled) {
        const rows = (data ?? []) as BenchmarkTypeOption[];
        setResults(filterBenchmarkCatalog(rows, programmingSegment) as BenchmarkTypeOption[]);
        setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, q, programmingSegment]);

  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase();
    if (!lower) return results;
    return results.filter((r) => r.name.toLowerCase().includes(lower));
  }, [results, q]);

  function confirmNew() {
    const label = newLabel.trim();
    if (!label) return;
    onPick({ kind: "new", label });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Add movement</DialogTitle>
          <DialogDescription>
            Picks are filtered by programming type. Use New for gym-specific movements not in the
            catalog.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => setNewMode((v) => !v)}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3 text-left text-sm transition-colors hover:bg-primary/10"
        >
          <Plus className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-semibold">New movement</span>
          <span className="text-xs text-muted-foreground">(not in library)</span>
        </button>

        {newMode && (
          <div className="space-y-2 rounded-md border border-border/60 p-3">
            <Label className="text-xs">Movement name</Label>
            <Input
              autoFocus
              placeholder="e.g. Tempo KB swing"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Button size="sm" onClick={confirmNew} disabled={!newLabel.trim()}>
              Add custom movement
            </Button>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search movements…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {loading && <Skeleton className="h-10 w-full" />}
          {!loading &&
            filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onPick({ kind: "catalog", bench: b });
                  onOpenChange(false);
                }}
                className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="font-medium">{b.name}</span>
                {b.stimulus && (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {b.stimulus}
                  </Badge>
                )}
              </button>
            ))}
          {!loading && !filtered.length && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No matches.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
