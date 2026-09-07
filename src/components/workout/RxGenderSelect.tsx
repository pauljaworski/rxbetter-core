import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { RxGender } from "@/lib/programming/rx-variants-schema";
import { WORKOUT_SCALE_OPTIONS, type WorkoutScale } from "@/lib/format";
import { resolveDayViewScale } from "@/lib/programming/day-view-scale";

type Props = {
  /** Scales programmed for metcons on the viewed day (Rx, Rx+, Fx, Scaled). */
  availableScales?: WorkoutScale[];
  viewScale?: WorkoutScale | null;
  onViewScaleChange?: (scale: WorkoutScale) => void;
};

export function RxGenderSelect({
  availableScales = [],
  viewScale = null,
  onViewScaleChange,
}: Props) {
  const { contactId, rxGender, setRxGender, defaultWorkoutScale } = useAuth();
  const [saving, setSaving] = useState(false);

  const effectiveScale = useMemo(
    () => resolveDayViewScale(viewScale, defaultWorkoutScale, availableScales),
    [viewScale, defaultWorkoutScale, availableScales],
  );

  const showScaleSelect =
    availableScales.length > 1 || availableScales.some((s) => s !== "rx");

  if (!contactId) return null;

  async function update(gender: RxGender | "unset") {
    setSaving(true);
    const value = gender === "unset" ? null : gender;
    const { error } = await supabase
      .from("contact")
      .update({ rx_gender: value })
      .eq("id", contactId);
    setSaving(false);
    if (error) {
      toast.error("Couldn't update Rx profile", { description: error.message });
      return;
    }
    setRxGender(value);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
      <Label className="text-xs text-muted-foreground">Your Rx profile</Label>
      <Select
        value={rxGender ?? "unset"}
        disabled={saving}
        onValueChange={(v) => void update(v as RxGender | "unset")}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Show M/F notation</SelectItem>
          <SelectItem value="male">Male Rx</SelectItem>
          <SelectItem value="female">Female Rx</SelectItem>
        </SelectContent>
      </Select>
      {showScaleSelect && effectiveScale && onViewScaleChange && (
        <>
          <Label className="text-xs text-muted-foreground">Level</Label>
          <Select
            value={effectiveScale}
            onValueChange={(v) => onViewScaleChange(v as WorkoutScale)}
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="Rx" />
            </SelectTrigger>
            <SelectContent>
              {availableScales.map((s) => {
                const label = WORKOUT_SCALE_OPTIONS.find((o) => o.value === s)?.label ?? s;
                return (
                  <SelectItem key={s} value={s}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}
