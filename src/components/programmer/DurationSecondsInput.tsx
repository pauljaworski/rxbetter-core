import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDurationSeconds,
  parseDurationSeconds,
} from "@/lib/programming/prescription-unit";

/** Controlled-ish time input: stores seconds, edits as m:ss. */
export function DurationSecondsInput({
  label,
  value,
  onChange,
  className,
  placeholder = "0:60",
  inputKey,
}: {
  label?: string;
  value: number | null;
  onChange: (sec: number | null) => void;
  className?: string;
  placeholder?: string;
  inputKey?: string;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      )}
      <Input
        className={className ?? "h-8 font-mono-num text-xs"}
        placeholder={placeholder}
        defaultValue={formatDurationSeconds(value) ?? ""}
        key={inputKey ?? `dur-${value ?? "x"}`}
        onBlur={(e) => onChange(parseDurationSeconds(e.target.value))}
      />
    </div>
  );
}
