import { useState } from "react";
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

export function RxGenderSelect() {
  const { contactId, rxGender, setRxGender } = useAuth();
  const [saving, setSaving] = useState(false);

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
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Show M/F notation</SelectItem>
          <SelectItem value="male">Male Rx</SelectItem>
          <SelectItem value="female">Female Rx</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
