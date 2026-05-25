import type { IntakeDraftPayload } from "@/hooks/staff/types";
import type { BenchmarkTypeOption } from "@/hooks/staff/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import {
  MANUAL_PROGRAMMING_TYPES,
  METCON_FORMAT_OPTIONS,
  filterBenchmarkCatalog,
  getLineItemMode,
  getTypeByUiKey,
  programmingSubtypeForUiKey,
  requiresMetconFormat,
  resolveProgrammingUiKey,
} from "@/lib/programming/manual-config";
import { LineItemFields } from "./LineItemFields";

type Props = {
  draft: IntakeDraftPayload;
  catalog: BenchmarkTypeOption[];
  onChange: (draft: IntakeDraftPayload) => void;
};

export function WodIntakeDraft({ draft, catalog, onChange }: Props) {
  const { segment, lineItems, warnings } = draft;
  const uiKey = resolveProgrammingUiKey({
    programming_segment: segment.programming_segment,
    metcon_format: segment.metcon_format,
    programming_subtype: segment.programming_subtype ?? null,
  });
  const filteredCatalog = filterBenchmarkCatalog(catalog, segment.programming_segment);
  const lineMode = getLineItemMode(segment.programming_segment);

  function patchSegment(patch: Partial<typeof segment>) {
    onChange({ ...draft, segment: { ...segment, ...patch } });
  }

  function patchItem(idx: number, patch: Partial<(typeof lineItems)[0]>) {
    const items = lineItems.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...draft, lineItems: items });
  }

  function setTypeUiKey(key: string) {
    const t = getTypeByUiKey(key);
    if (!t) return;
    patchSegment({
      programming_segment: t.dbSegment,
      metcon_format: t.requiresFormat ? segment.metcon_format : null,
      programming_subtype: programmingSubtypeForUiKey(key),
    });
  }

  return (
    <Card className="glass-card space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold">Parsed draft</p>
        {warnings.map((w) => (
          <Badge key={w} variant="outline" className="gap-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            {w}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={uiKey} onValueChange={setTypeUiKey}>
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_PROGRAMMING_TYPES.map((s) => (
              <SelectItem key={s.uiKey} value={s.uiKey}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requiresMetconFormat(segment.programming_segment) && (
          <Select
            value={segment.metcon_format ?? ""}
            onValueChange={(v) => patchSegment({ metcon_format: v || null })}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="format" />
            </SelectTrigger>
            <SelectContent>
              {METCON_FORMAT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input
          value={segment.name ?? ""}
          onChange={(e) => patchSegment({ name: e.target.value })}
          placeholder="Segment name"
          className="h-8 max-w-xs flex-1"
        />
      </div>

      <Textarea
        value={segment.description ?? ""}
        onChange={(e) => patchSegment({ description: e.target.value })}
        placeholder="Workout description"
        rows={2}
        className="text-sm"
      />

      {lineItems.map((it, j) => (
        <div key={j} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono-num text-[11px] font-bold text-muted-foreground">
              {j + 1}
            </span>
            <Select
              value={it.benchmark_type_id ?? ""}
              onValueChange={(v) => {
                const b = catalog.find((c) => c.id === v);
                patchItem(j, {
                  benchmark_type_id: v || null,
                  bench_name: b?.name ?? it.bench_name,
                });
              }}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue placeholder="Movement" />
              </SelectTrigger>
              <SelectContent>
                {filteredCatalog.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LineItemFields mode={lineMode} item={it} onChange={(patch) => patchItem(j, patch)} />
        </div>
      ))}
    </Card>
  );
}
