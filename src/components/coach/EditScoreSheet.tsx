import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useStaffPerformanceUpdate } from "@/hooks/staff/useStaffPerformanceUpdate";
import type {
  StaffClassContact,
  StaffClassLineItem,
  StaffClassPerformance,
  StaffClassWod,
} from "@/hooks/staff/types";

export type EditScoreContext = {
  perf: StaffClassPerformance;
  item: StaffClassLineItem;
  wod: StaffClassWod;
  contact: StaffClassContact;
};

export function EditScoreSheet({
  editing,
  onClose,
  onSaved,
}: {
  editing: EditScoreContext | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { updatePerformance, submitting } = useStaffPerformanceUpdate();
  const [score, setScore] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");

  useEffect(() => {
    if (!editing) return;
    setScore(editing.perf.score ?? "");
    setWeight(editing.perf.weight_lifted != null ? String(editing.perf.weight_lifted) : "");
    setRpe(editing.perf.rpe != null ? String(editing.perf.rpe) : "");
  }, [editing]);

  async function save() {
    if (!editing) return;
    const wNum = weight ? Number(weight) : null;
    const rNum = rpe ? Number(rpe) : null;
    const { error } = await updatePerformance({
      performanceId: editing.perf.id,
      score: score || null,
      weightLifted: wNum,
      rpe: rNum,
    });
    if (error) {
      toast.error("Couldn't update score", { description: error });
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
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" /> {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
