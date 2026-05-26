import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { EditorLineItem } from "@/hooks/staff/types";
import type { MovementComponent } from "@/lib/programming/movement-components-schema";
import { formatComplexMovementTitle } from "@/lib/programming/movement-components-schema";
import type { CatalogEntry } from "@/lib/programming/manual-config";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: CatalogEntry[];
  initial?: EditorLineItem | null;
  onSave: (items: EditorLineItem[]) => void;
};

function emptyComponent(): MovementComponent {
  return { benchmark_type_id: null, reps: 1, label: "" };
}

export function ComplexSetEditor({ open, onOpenChange, catalog, initial, onSave }: Props) {
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

  function updateComponent(idx: number, patch: Partial<MovementComponent>) {
    setComponents((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );
  }

  function pickCatalog(idx: number, typeId: string) {
    const entry = catalog.find((c) => c.id === typeId);
    updateComponent(idx, {
      benchmark_type_id: typeId,
      label: entry?.name ?? components[idx]?.label ?? "",
    });
    if (!prTypeId) setPrTypeId(typeId);
  }

  function handleSave() {
    const normalized = components
      .map((c) => ({
        benchmark_type_id: c.benchmark_type_id,
        reps: Math.max(1, c.reps || 1),
        label: (c.label || "").trim(),
      }))
      .filter((c) => c.label.length > 0);
    if (normalized.length < 2) return;
    const componentsCopy = normalized.map((c) => ({ ...c }));
    const title = formatComplexMovementTitle(componentsCopy);
    const prId =
      prTypeId ?? componentsCopy.find((c) => c.benchmark_type_id)?.benchmark_type_id ?? null;
    const setCount = Math.max(1, sets);
    const item: EditorLineItem = {
      _new: true,
      sequence_number: 0,
      reps_prescribed: setCount,
      prescribed_weight: null,
      prescribed_percentage: pct != null ? pct / 100 : null,
      prescribed_score: null,
      benchmark_type_id: prId,
      benchmark_definition_id: initial?.benchmark_definition_id ?? null,
      percent_rep_max: initial?.percent_rep_max ?? 1,
      bench_name: title,
      movement_label: title,
      line_item_kind: "complex_set",
      movement_components: componentsCopy,
    };
    onSave([item]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Complex set</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Compose atomic movements (e.g. 2 Clean Pull + 1 Power Clean). PR basis uses the
            movement you select below.
          </p>
          {components.map((c, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
              <div className="space-y-1">
                <Label className="text-[9px] uppercase">Reps</Label>
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
                    <SelectItem value="__custom">Custom label</SelectItem>
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
                  />
                </div>
              )}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Sets</Label>
              <Input
                type="number"
                min={1}
                className="h-8 font-mono-num"
                value={sets}
                onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-1">
              <Label>% (optional)</Label>
              <Input
                type="number"
                className="h-8 font-mono-num"
                value={pct ?? ""}
                onChange={(e) =>
                  setPct(e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>PR basis movement</Label>
            <Select value={prTypeId ?? ""} onValueChange={(v) => setPrTypeId(v || null)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="First linked movement" />
              </SelectTrigger>
              <SelectContent>
                {components
                  .filter((c) => c.benchmark_type_id)
                  .map((c) => (
                    <SelectItem key={c.benchmark_type_id!} value={c.benchmark_type_id!}>
                      {c.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add complex</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
