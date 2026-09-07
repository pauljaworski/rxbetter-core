import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseScoreToSeconds } from "@/lib/programming/metcon-score";
import { formatSecondsToMmSs } from "@/lib/programming/rft-score";

type Props = {
  label: string;
  valueSec: number;
  onChange: (sec: number) => void;
  minSec?: number;
  maxSec?: number;
  className?: string;
};

/**
 * Interval / duration entry: type mm:ss, m:ss, or plain seconds.
 * Local string state so typing isn't fought by immediate Math.max clamping.
 */
export function DurationSecInput({
  label,
  valueSec,
  onChange,
  minSec = 30,
  maxSec = 600,
  className,
}: Props) {
  const [text, setText] = useState(() => formatSecondsToMmSs(valueSec));

  useEffect(() => {
    setText(formatSecondsToMmSs(valueSec));
  }, [valueSec]);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setText(formatSecondsToMmSs(valueSec));
      return;
    }
    const parsed = parseScoreToSeconds(trimmed);
    if (parsed == null || parsed < 0) {
      setText(formatSecondsToMmSs(valueSec));
      return;
    }
    const next = Math.min(maxSec, Math.max(minSec, Math.round(parsed)));
    onChange(next);
    setText(formatSecondsToMmSs(next));
  }

  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        inputMode="numeric"
        className={className ?? "h-8 w-28 font-mono-num"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        placeholder="4:00 or 240"
      />
      <p className="text-[10px] text-muted-foreground">mm:ss or seconds</p>
    </div>
  );
}
