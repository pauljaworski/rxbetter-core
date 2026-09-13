import { useCallback, useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  cancelClassCheckin,
  checkIntoClass,
  defaultClassesForDay,
  fetchCheckinsForDay,
  type ClassCheckin,
  type ClassSlot,
} from "@/lib/classes/class-checkin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymId: string | null;
  contactId: string | null;
  /** yyyy-MM-dd */
  dateKey: string;
  onCheckedIn?: () => void;
};

/** Prompt athlete to pick a class time when logging a score without a check-in. */
export function ClassCheckinPrompt({
  open,
  onOpenChange,
  gymId,
  contactId,
  dateKey,
  onCheckedIn,
}: Props) {
  const [busy, setBusy] = useState(false);
  const slots = defaultClassesForDay(new Date(`${dateKey}T12:00:00`));

  async function pick(slot: ClassSlot) {
    if (!gymId || !contactId) return;
    setBusy(true);
    const { error } = await checkIntoClass({ gymId, contactId, dateKey, slot });
    setBusy(false);
    if (error) {
      toast.error("Couldn't check in", { description: error });
      return;
    }
    toast.success(`Checked in · ${slot.label}`);
    onCheckedIn?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Which class?</DialogTitle>
          <DialogDescription>
            Pick the class time for {format(new Date(`${dateKey}T12:00:00`), "EEE, MMM d")} so this
            score is tied to your session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {slots.map((slot) => (
            <Button
              key={slot.key}
              type="button"
              variant="outline"
              disabled={busy}
              className="justify-between"
              onClick={() => void pick(slot)}
            >
              <span className="font-semibold">{slot.label}</span>
              <span className="text-xs text-muted-foreground">{slot.type}</span>
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useDayClassCheckins(
  gymId: string | null,
  contactId: string | null,
  dateKey: string | null,
) {
  const [checkins, setCheckins] = useState<ClassCheckin[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!gymId || !contactId || !dateKey) {
      setCheckins([]);
      return;
    }
    setLoading(true);
    try {
      setCheckins(await fetchCheckinsForDay(gymId, contactId, dateKey));
    } catch {
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }, [gymId, contactId, dateKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { checkins, loading, reload, hasCheckin: checkins.length > 0 };
}

/** After logging a score, prompt for class check-in when the athlete has none that day. */
export function useScoreCheckinGate(
  gymId: string | null,
  contactId: string | null,
  dateKey: string,
  onLogged: () => void,
): { wrapOnLogged: () => void; prompt: ReactNode } {
  const { hasCheckin, reload } = useDayClassCheckins(gymId, contactId, dateKey);
  const [open, setOpen] = useState(false);

  const wrapOnLogged = useCallback(() => {
    onLogged();
    if (!hasCheckin && gymId && contactId) setOpen(true);
  }, [onLogged, hasCheckin, gymId, contactId]);

  const prompt = (
    <ClassCheckinPrompt
      open={open}
      onOpenChange={setOpen}
      gymId={gymId}
      contactId={contactId}
      dateKey={dateKey}
      onCheckedIn={() => void reload()}
    />
  );

  return { wrapOnLogged, prompt };
}

export { checkIntoClass, defaultClassesForDay, cancelClassCheckin };
