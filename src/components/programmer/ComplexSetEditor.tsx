import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { EditorLineItem } from "@/hooks/staff/types";
import type { MovementComponent } from "@/lib/programming/movement-components-schema";
import { formatComplexMovementTitle } from "@/lib/programming/movement-components-schema";
import type { CatalogEntry } from "@/lib/programming/manual-config";
import { ensureGymBenchmarkType, formatRestDuration, parseRestDuration } from "@/lib/programming/gym-benchmark-type";
import { PRESCRIPTION_UNITS, type PrescriptionUnit } from "@/lib/programming/prescription-unit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: CatalogEntry[];
  gymId: string | null;
  programmingSegment: string;
  initial?: EditorLineItem | null;
  onSave: (items: EditorLineItem[]) => void;
};

function emptyComponent(): MovementComponent {
  return { benchmark_type_id: null, reps: 1, unit: "reps", label: "", rest_after_sec: null };
}

export function ComplexSetEditor({
  open,
  onOpenChange,
  catalog,
  gymId,
  programmingSegment,
  initial,
  onSave,
}: Props) {
  const [components, setComponents] = useState<MovementComponent[]>(
    initial?.movement_components?.length
      ? [...initial.movement_components]
      : [emptyComponent(), emptyComponent()],
  );
  const [prTypeId, setPrTypeId] = useState<string | null>(initial?.benchmark_type_id ?? null);
  const [sets, setSets] = useState(initial?.reps_prescribed ?? 5);
  const [pct, setPct] = useState<number | null>(
    initial?.prescribed_percentage != null ? initial.prescribed_percentage * 100 : null,
  );
  const [restBetweenSets, setRestBetweenSets] = useState(
    formatRestDuration(initial?.rest_sec) ?? "",
  );
  const [saving, setSaving] = useState(false);

  function updateComponent(idx: number, patch: Partial<MovementComponent>) {
    setComponents((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function pickCatalog(idx: number, typeId: string) {
    const entry = catalog.find((c) => c.id === typeId);
    updateComponent(idx, {
      benchmark_type_id: typeId,
      label: entry?.name ?? components[idx]?.label ?? "",
    });
  }

  async function handleSave() {
    const normalized = components
      .map((c) => ({
        benchmark_type_id: c.benchmark_type_id,
        reps: Math.max(1, c.reps || 1),
        unit: (c.unit ?? "reps") as PrescriptionUnit,
        label: (c.label || "").trim(),
        rest_after_sec: c.rest_after_sec ?? null,
      }))
      .filter((c) => c.label.length > 0);
    if (normalized.length < 2) {
      toast.error("Add at least two movements");
      return;
    }

    setSaving(true);
    try {
      const linked: MovementComponent[] = [];
      for (const c of normalized) {
        if (c.benchmark_type_id || !gymId) {
          linked.push(c);
          continue;
        }
        const created = await ensureGymBenchmarkType(gymId, c.label, programmingSegment);
        linked.push({ ...c, benchmark_type_id: created.id, label: created.name });
      }

      const restSec = parseRestDuration(restBetweenSets);
      const skipPr = !prTypeId;
      const title = formatComplexMovementTitle(linked, {
        restBetweenSetsSec: skipPr ? restSec : restSec,
      });
      const setCount = Math.max(1, sets);
      const pctFraction = skipPr || pct == null ? null : pct / 100;
      const base: EditorLineItem = {
        _new: true,
        sequence_number: 0,
        reps_prescribed: null,
        prescription_unit: null,
        prescribed_weight: null,
        prescribed_percentage: pctFraction,
        prescribed_score: null,
        benchmark_type_id: prTypeId,
        benchmark_definition_id: initial?.benchmark_definition_id ?? null,
        percent_rep_max: initial?.percent_rep_max ?? 1,
        bench_name: title,
        movement_label: title,
        line_item_kind: "complex_set",
        movement_components: linked,
        rest_sec: restSec,
        skip_pr_basis: skipPr,
      };
      onSave(Array.from({ length: setCount }, () => ({ ...base })));
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save multi-move set");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Multi-movement set</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Olympic complex (2 Pull + 1 Snatch) or strength circuit (8 BSS, 12 RDL, 60&apos; carry,
            Rest 1:30). Link movements to the catalog when possible; new names save to this gym
            only.
          </p>
          {components.map((c, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase">Amount</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-16 font-mono-num"
                  value={c.reps}
                  onChange={(e) =>
                    updateComponent(idx, { reps: Number(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase">Unit</Label>
                <Select
                  value={c.unit ?? "reps"}
                  onValueChange={(v) => updateComponent(idx, { unit: v as PrescriptionUnit })}
                >
                  <SelectTrigger className="h-8 w-[5.5rem] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESCRIPTION_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[10rem] flex-1 space-y-1">
                <Label className="text-[9px] uppercase">Movement</Label>
                <Select
                  value={c.benchmark_type_id ?? "__custom"}
                  onValueChange={(v) => {
                    if (v === "__custom") {
                      updateComponent(idx, { benchmark_type_id: null });
                    } else pickCatalog(idx, v);
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Pick…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__custom">Custom / new</SelectItem>
                    {catalog.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!c.benchmark_type_id && (
                <div className="min-w-[8rem] flex-1 space-y-1">
                  <Label className="text-[9px] uppercase">Label</Label>
                  <Input
                    className="h-8"
                    value={c.label}
                    onChange={(e) => updateComponent(idx, { label: e.target.value })}
                    placeholder="e.g. Bulgarian Split Squat/leg"
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-[9px] uppercase">Rest after</Label>
                <Input
                  className="h-8 w-20 font-mono-num"
                  placeholder="0:30"
                  defaultValue={formatRestDuration(c.rest_after_sec) ?? ""}
                  key={`rest-${idx}-${c.rest_after_sec ?? "x"}`}
                  onBlur={(e) =>
                    updateComponent(idx, { rest_after_sec: parseRestDuration(e.target.value) })
                  }
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={components.length <= 2}
                onClick={() => setComponents((p) => p.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setComponents((p) => [...p, emptyComponent()])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add movement
          </Button>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Sets</Label>
              <Input
                type="number"
                min={1}
                className="h-8 font-mono-num"
                value={sets}
                onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="text-[10px] text-muted-foreground">One row per set for logging.</p>
            </div>
            <div className="space-y-1">
              <Label>Rest between sets</Label>
              <Input
                className="h-8 font-mono-num"
                placeholder="1:30"
                value={restBetweenSets}
                onChange={(e) => setRestBetweenSets(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>% (optional)</Label>
              <Input
                type="number"
                className="h-8 font-mono-num"
                disabled={!prTypeId}
                value={pct ?? ""}
                onChange={(e) =>
                  setPct(e.target.value === "" ? null : Number(e.target.value))
                }
              />
              {!prTypeId && (
                <p className="text-[10px] text-muted-foreground">Select a PR basis to use %.</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label>PR basis movement</Label>
            <Select
              value={prTypeId ?? "__none"}
              onValueChange={(v) => {
                if (v === "__none") {
                  setPrTypeId(null);
                  setPct(null);
                } else {
                  setPrTypeId(v);
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="None — no % of PR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None — no % of PR</SelectItem>
                {components
                  .filter((c) => c.benchmark_type_id)
                  .map((c) => (
                    <SelectItem key={c.benchmark_type_id!} value={c.benchmark_type_id!}>
                      {c.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Choose None when this block should not use an athlete&apos;s existing PRs (fixed
              loads / RPE only).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Add multi-move set"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
