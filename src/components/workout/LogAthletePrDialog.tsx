import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { recordAthletePr } from "@/lib/pr/record-athlete-pr";
import { percentRepMaxLabel } from "@/lib/programming/percent-calculator";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  benchmarkDefinitionId: string | null;
  benchmarkTypeId: string | null;
  movementName: string;
  repMaxCount: number;
  repsPrescribed?: number | null;
  defaultDate?: string;
  onSaved?: () => void;
};

export function LogAthletePrDialog({
  open,
  onOpenChange,
  contactId,
  benchmarkDefinitionId,
  benchmarkTypeId,
  movementName,
  repMaxCount,
  repsPrescribed,
  defaultDate,
  onSaved,
}: Props) {
  const [weight, setWeight] = useState("");
  const [prDate, setPrDate] = useState(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setWeight("");
      setPrDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
    }
  }, [open, defaultDate]);

  async function submit() {
    if (!contactId) {
      toast.error("Sign in to log a PR");
      return;
    }
    if (!benchmarkDefinitionId) {
      toast.error("This lift is not linked to the movement catalog yet.");
      return;
    }
    const weightNum = Number(weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      toast.error("Enter a valid weight (lb)");
      return;
    }
    if (!prDate) {
      toast.error("Select a date");
      return;
    }

    setSubmitting(true);
    const { error } = await recordAthletePr({
      contactId,
      benchmarkDefinitionId,
      benchmarkTypeId,
      weightLb: weightNum,
      performanceDate: prDate,
      repsPrescribed: repsPrescribed ?? null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't save PR", { description: error });
      return;
    }

    toast.success("PR saved", {
      description: `${Math.round(weightNum)} lb ${percentRepMaxLabel(repMaxCount)} on ${prDate}`,
    });
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
            <Flame className="h-5 w-5 text-accent" />
            Log {movementName} PR
          </DialogTitle>
          <DialogDescription>
            Adds a historical attempt on the date you choose and recalculates your current{" "}
            {percentRepMaxLabel(repMaxCount)} from all logged attempts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pr-weight">Weight (lb)</Label>
            <Input
              id="pr-weight"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 185"
              className="font-mono-num text-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pr-date">Date achieved</Label>
            <Input
              id="pr-date"
              type="date"
              value={prDate}
              onChange={(e) => setPrDate(e.target.value)}
              className="font-mono-num"
            />
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : "Save PR"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
