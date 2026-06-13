import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useBenchmarkCatalog } from "@/hooks/staff/useBenchmarkCatalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseSpreadsheetFile } from "@/lib/import/parse-spreadsheet";
import {
  applyColumnMapping,
  detectColumnMapping,
  IMPORT_FIELD_LABELS,
  type ImportField,
} from "@/lib/import/map-import-columns";
import {
  countImportableRows,
  prepareImportRows,
  type PreparedImportRow,
} from "@/lib/import/prepare-import-rows";
import { resolveDefinitionId } from "@/lib/import/match-benchmark";
import { commitAthleteImport } from "@/lib/import/commit-athlete-import";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  onImported?: () => void;
};

type Step = "upload" | "map" | "review";

export function AthleteDataImportDialog({ open, onOpenChange, contactId, onImported }: Props) {
  const { data: catalog } = useBenchmarkCatalog();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ImportField[]>([]);
  const [prepared, setPrepared] = useState<PreparedImportRow[]>([]);
  const [definitions, setDefinitions] = useState<
    { id: string; benchmark_type_id: string; rep_count: number }[]
  >([]);
  const [importing, setImporting] = useState(false);
  const [manualBench, setManualBench] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!open) {
      setStep("upload");
      setFileName(null);
      setHeaders([]);
      setRawRows([]);
      setMapping([]);
      setPrepared([]);
      setManualBench({});
      return;
    }
    supabase
      .from("benchmark_definition")
      .select("id, benchmark_type_id, rep_count")
      .then(({ data }) => setDefinitions((data ?? []) as typeof definitions));
  }, [open]);

  useEffect(() => {
    if (!rawRows.length || !mapping.length) return;
    setPrepared(
      prepareImportRows(
        applyColumnMapping({ headers, rows: rawRows }, mapping),
        catalog,
        definitions,
      ),
    );
  }, [catalog, definitions, headers, rawRows, mapping]);

  const counts = useMemo(() => countImportableRows(prepared), [prepared]);

  const applyManualMatches = useCallback(
    (rows: PreparedImportRow[]): PreparedImportRow[] =>
      rows.map((row) => {
        const benchId = manualBench[row.rowIndex];
        if (!benchId || row.kind !== "lift") return row;
        const defId = resolveDefinitionId(benchId, row.repCount ?? 1, definitions);
        const bench = catalog.find((c) => c.id === benchId);
        return {
          ...row,
          benchmarkTypeId: benchId,
          benchmarkDefinitionId: defId,
          skipReason: defId ? null : `No ${row.repCount ?? 1}RM for ${bench?.name ?? "lift"}`,
        };
      }),
    [manualBench, definitions, catalog],
  );

  const reviewRows = useMemo(() => applyManualMatches(prepared), [prepared, applyManualMatches]);
  const reviewCounts = useMemo(() => countImportableRows(reviewRows), [reviewRows]);

  function refreshPrepared(nextMapping: ImportField[], rows = rawRows, hdrs = headers) {
    setMapping(nextMapping);
    setPrepared(
      prepareImportRows(
        applyColumnMapping({ headers: hdrs, rows }, nextMapping),
        catalog,
        definitions,
      ),
    );
  }

  async function onFileSelected(file: File) {
    const table = await parseSpreadsheetFile(file);
    if (!table) {
      toast.error("Couldn't read file", {
        description: "Upload a .csv or .xlsx with a header row and data.",
      });
      return;
    }
    const detected = detectColumnMapping(table.headers);
    setFileName(file.name);
    setHeaders(table.headers);
    setRawRows(table.rows);
    refreshPrepared(detected, table.rows, table.headers);
    setStep("map");
  }

  function setColumnField(colIdx: number, field: ImportField) {
    const next = [...mapping];
    next[colIdx] = field;
    refreshPrepared(next);
  }

  async function handleImport() {
    if (!contactId) {
      toast.error("Sign in to import data.");
      return;
    }
    const rows = applyManualMatches(prepared);
    const { lifts, workouts } = countImportableRows(rows);
    if (lifts + workouts === 0) {
      toast.error("Nothing to import", { description: "Fix unmatched rows or column mapping." });
      return;
    }

    setImporting(true);
    const result = await commitAthleteImport(contactId, rows);
    setImporting(false);

    if (result.errors.length) {
      toast.error("Import finished with errors", { description: result.errors[0] });
    } else {
      toast.success("Import complete", {
        description: `${result.inserted} added${result.duplicates ? `, ${result.duplicates} duplicates skipped` : ""}`,
      });
      onImported?.();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import workout history</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel export (SugarWOD, spreadsheets, etc.). We&apos;ll map columns and
            add lifts to your PR vault and scores to History.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-muted/30">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-semibold">Choose .csv or .xlsx</p>
              <p className="text-xs text-muted-foreground">
                Expected columns: date, movement, weight, reps — or date, workout, score
              </p>
            </div>
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFileSelected(f);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="secondary" size="sm" asChild>
              <span>
                <Upload className="mr-1 h-3.5 w-3.5" /> Browse
              </span>
            </Button>
          </label>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{fileName}</span> ·{" "}
              {prepared.length} rows
            </p>
            <div className="space-y-2">
              <Label>Column mapping</Label>
              <div className="space-y-2 rounded-md border border-border p-3">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-[8rem] truncate font-mono text-xs text-muted-foreground">
                      {h || `Column ${idx + 1}`}
                    </span>
                    <Select
                      value={mapping[idx] ?? "skip"}
                      onValueChange={(v) => setColumnField(idx, v as ImportField)}
                    >
                      <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(IMPORT_FIELD_LABELS) as ImportField[]).map((f) => (
                          <SelectItem key={f} value={f}>
                            {IMPORT_FIELD_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{counts.lifts} lifts ready</Badge>
              <Badge variant="secondary">{counts.workouts} workout scores</Badge>
              {counts.needsMatch > 0 && (
                <Badge variant="outline" className="text-amber-600">
                  {counts.needsMatch} need movement match
                </Badge>
              )}
              <Badge variant="outline">{counts.skipped} skipped</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button size="sm" onClick={() => setStep("review")}>
                Review rows
              </Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>{reviewCounts.lifts} lifts</Badge>
              <Badge>{reviewCounts.workouts} workouts</Badge>
              {reviewCounts.needsMatch > 0 && (
                <Badge variant="outline" className="text-amber-600">
                  {reviewCounts.needsMatch} unmatched
                </Badge>
              )}
            </div>
            <div className="max-h-[40vh] space-y-1 overflow-y-auto rounded-md border border-border p-2 text-xs">
              {reviewRows.slice(0, 50).map((row) => (
                <div
                  key={row.rowIndex}
                  className="flex flex-wrap items-center gap-2 border-b border-border/40 py-1.5 last:border-0"
                >
                  <span className="font-mono-num text-muted-foreground">#{row.rowIndex + 2}</span>
                  {row.kind === "skip" ? (
                    <span className="text-muted-foreground">{row.skipReason}</span>
                  ) : (
                    <>
                      <span className="font-mono-num">{row.date}</span>
                      <span className="font-medium">{row.movementLabel ?? row.workoutName}</span>
                      {row.weightLb != null && <span>{Math.round(row.weightLb)} lb</span>}
                      {row.repCount != null && row.kind === "lift" && (
                        <span className="text-muted-foreground">{row.repCount}RM</span>
                      )}
                      {row.score && <span>{row.score}</span>}
                      {row.kind === "lift" && !row.benchmarkDefinitionId && (
                        <Select
                          value={manualBench[row.rowIndex] ?? ""}
                          onValueChange={(v) =>
                            setManualBench((prev) => ({ ...prev, [row.rowIndex]: v }))
                          }
                        >
                          <SelectTrigger className="h-7 w-[160px] text-[10px]">
                            <SelectValue placeholder="Match movement…" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalog.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              ))}
              {reviewRows.length > 50 && (
                <p className="py-2 text-center text-muted-foreground">
                  + {reviewRows.length - 50} more rows
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("map")}>
                Back
              </Button>
              <Button
                size="sm"
                disabled={importing || reviewCounts.lifts + reviewCounts.workouts === 0}
                onClick={() => void handleImport()}
              >
                {importing
                  ? "Importing…"
                  : `Import ${reviewCounts.lifts + reviewCounts.workouts} rows`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
