import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Copy, Plus } from "lucide-react";
import type { EditorWod, ProgramLibrary } from "@/hooks/staff/types";
import { fetchProgrammingSegmentsForDate } from "@/hooks/staff/useStaffProgrammingDay";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MANUAL_PROGRAMMING_TYPES,
  METCON_FORMAT_OPTIONS,
  getTypeByUiKey,
} from "@/lib/programming/manual-config";

type Mode = "choose" | "new" | "copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeGymId: string | null;
  libraries: ProgramLibrary[];
  defaultLib: string | null;
  displayOrder: number;
  onAdd: (wod: EditorWod) => void;
};

export function SegmentAddDialog({
  open,
  onOpenChange,
  activeGymId,
  libraries,
  defaultLib,
  displayOrder,
  onAdd,
}: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [uiKey, setUiKey] = useState("metcon");
  const [metconFormat, setMetconFormat] = useState<string>("for_time");
  const [name, setName] = useState("");
  const [libIds, setLibIds] = useState<string[]>([]);
  const [copyDate, setCopyDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [copySegments, setCopySegments] = useState<EditorWod[]>([]);
  const [copyLoading, setCopyLoading] = useState(false);
  const [selectedCopyIdx, setSelectedCopyIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("choose");
      setUiKey("metcon");
      setMetconFormat("for_time");
      setName("");
      setLibIds(defaultLib ? [defaultLib] : []);
      setSelectedCopyIdx(null);
      setCopySegments([]);
      return;
    }
    setLibIds(defaultLib ? [defaultLib] : []);
  }, [open, defaultLib]);

  async function loadCopySegments() {
    if (!activeGymId) return;
    setCopyLoading(true);
    try {
      const segs = await fetchProgrammingSegmentsForDate(
        activeGymId,
        new Date(copyDate + "T00:00:00"),
      );
      setCopySegments(segs);
      setSelectedCopyIdx(segs.length ? 0 : null);
    } finally {
      setCopyLoading(false);
    }
  }

  useEffect(() => {
    if (open && mode === "copy") loadCopySegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when copy tab active
  }, [open, mode, copyDate, activeGymId]);

  function toggleLib(id: string, checked: boolean) {
    setLibIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return Array.from(next);
    });
  }

  function confirmNew() {
    const t = getTypeByUiKey(uiKey);
    if (!t) return;
    const segmentName = name.trim() || t.label;
    const ids = libIds.length ? libIds : defaultLib ? [defaultLib] : [];
    onAdd({
      _new: true,
      name: segmentName,
      description: "",
      programming_segment: t.dbSegment,
      metcon_format: t.requiresFormat ? metconFormat : null,
      athlete_notes: null,
      coaches_notes: null,
      display_order: displayOrder,
      program_library_id: ids[0] ?? null,
      program_library_ids: ids,
      items: [],
    });
    onOpenChange(false);
  }

  function confirmCopy() {
    if (selectedCopyIdx == null || !copySegments[selectedCopyIdx]) return;
    const src = copySegments[selectedCopyIdx];
    const ids =
      src.program_library_ids?.length > 0
        ? src.program_library_ids
        : defaultLib
          ? [defaultLib]
          : [];
    onAdd({
      ...src,
      _new: true,
      display_order: displayOrder,
      program_library_id: ids[0] ?? src.program_library_id,
      program_library_ids: ids,
      items: src.items.map((it, j) => ({
        ...it,
        _new: true,
        id: undefined,
        sequence_number: j + 1,
      })),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add segment</DialogTitle>
          <DialogDescription>Copy an existing segment or create a new one.</DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => setMode("copy")}>
              <Copy className="h-5 w-5" />
              <span className="font-semibold">Copy from date</span>
              <span className="text-xs font-normal text-muted-foreground">
                Clone a segment from another day
              </span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => setMode("new")}>
              <Plus className="h-5 w-5" />
              <span className="font-semibold">New segment</span>
              <span className="text-xs font-normal text-muted-foreground">
                Pick type, format, and tracks
              </span>
            </Button>
          </div>
        )}

        {mode === "new" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setMode("choose")}>
              Back
            </Button>
            <div className="space-y-2">
              <Label>Programming type</Label>
              <Select value={uiKey} onValueChange={setUiKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_PROGRAMMING_TYPES.map((t) => (
                    <SelectItem key={t.uiKey} value={t.uiKey}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {getTypeByUiKey(uiKey)?.requiresFormat && (
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={metconFormat} onValueChange={setMetconFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METCON_FORMAT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Segment name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Required" />
            </div>
            <div className="space-y-2">
              <Label>Publish to tracks</Label>
              <div className="flex flex-wrap gap-2">
                {libraries.map((lib) => (
                  <label
                    key={lib.id}
                    className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                  >
                    <Checkbox
                      checked={libIds.includes(lib.id)}
                      onCheckedChange={(c) => toggleLib(lib.id, c === true)}
                    />
                    {lib.name}
                  </label>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={confirmNew}
              disabled={!name.trim() || !libIds.length}
            >
              Create segment
            </Button>
          </div>
        )}

        {mode === "copy" && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setMode("choose")}>
              Back
            </Button>
            <div className="space-y-2">
              <Label>Copy from date</Label>
              <Input type="date" value={copyDate} onChange={(e) => setCopyDate(e.target.value)} />
            </div>
            {copyLoading && <Skeleton className="h-24 w-full" />}
            {!copyLoading && copySegments.length === 0 && (
              <p className="text-sm text-muted-foreground">No segments on that date.</p>
            )}
            {!copyLoading &&
              copySegments.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCopyIdx(idx)}
                  className={`w-full rounded-md border p-3 text-left text-sm ${
                    selectedCopyIdx === idx ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <span className="font-semibold">{s.name ?? "Untitled"}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.programming_segment}
                    {s.items.length ? ` · ${s.items.length} movements` : ""}
                  </span>
                </button>
              ))}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={confirmCopy}
              disabled={selectedCopyIdx == null}
            >
              Add copied segment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
