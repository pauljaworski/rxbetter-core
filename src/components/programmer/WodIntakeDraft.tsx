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

const SEGMENTS = [
  { value: "warmup", label: "Warm-up" },
  { value: "skill", label: "Skill" },
  { value: "strength", label: "Strength" },
  { value: "weightlifting", label: "Weightlifting" },
  { value: "metcon", label: "Metcon" },
  { value: "accessory", label: "Accessory" },
  { value: "cooldown", label: "Cooldown" },
];

const METCON_FORMATS = ["amrap", "for_time", "emom", "rft", "tabata", "chipper"];

type Props = {
  draft: IntakeDraftPayload;
  catalog: BenchmarkTypeOption[];
  onChange: (draft: IntakeDraftPayload) => void;
};

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        className="h-8 font-mono-num text-xs"
      />
    </div>
  );
}

export function WodIntakeDraft({ draft, catalog, onChange }: Props) {
  const { segment, lineItems, warnings } = draft;

  function patchSegment(patch: Partial<typeof segment>) {
    onChange({ ...draft, segment: { ...segment, ...patch } });
  }

  function patchItem(idx: number, patch: Partial<(typeof lineItems)[0]>) {
    const items = lineItems.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...draft, lineItems: items });
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
        <Select
          value={segment.programming_segment}
          onValueChange={(v) => patchSegment({ programming_segment: v })}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEGMENTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {segment.programming_segment === "metcon" && (
          <Select
            value={segment.metcon_format ?? ""}
            onValueChange={(v) => patchSegment({ metcon_format: v || null })}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="format" />
            </SelectTrigger>
            <SelectContent>
              {METCON_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.toUpperCase()}
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
                {catalog.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <NumInput
              label={/\d+\s*x\s*\d+/i.test(it.prescribed_score ?? "") ? "reps / set" : "reps"}
              value={it.reps_prescribed}
              onChange={(v) => patchItem(j, { reps_prescribed: v })}
            />
            <NumInput
              label="weight (lb)"
              value={it.prescribed_weight}
              onChange={(v) => patchItem(j, { prescribed_weight: v })}
            />
            <NumInput
              label="% 1RM"
              value={it.prescribed_percentage != null ? it.prescribed_percentage * 100 : null}
              onChange={(v) =>
                patchItem(j, { prescribed_percentage: v != null ? v / 100 : null })
              }
            />
            <div className="space-y-1">
              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                score
              </Label>
              <Input
                value={it.prescribed_score ?? ""}
                onChange={(e) => patchItem(j, { prescribed_score: e.target.value || null })}
                className="h-8 font-mono-num text-xs"
              />
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}
