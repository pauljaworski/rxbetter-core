import { addDays, format, isValid, parse, startOfWeek } from "date-fns";

export type DayPasteBlock = {
  /** yyyy-MM-dd */
  dateKey: string;
  label: string;
  rawText: string;
};

export type SegmentPasteBlock = {
  dateKey: string;
  dayLabel: string;
  rawText: string;
  /** Index within the day (0-based). */
  segmentIndex: number;
};

const WEEKDAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAY_SHORT: Record<string, number> = {
  mon: 0,
  tue: 1,
  tues: 1,
  wed: 2,
  thu: 3,
  thur: 3,
  thurs: 3,
  fri: 4,
  sat: 5,
  sun: 6,
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

/** Header line that starts a new calendar day. */
const DAY_HEADER =
  /^(?:#{1,3}\s*)?(?:day\s*[:=\-]?\s*)?(?:(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b\.?)(?:\s*[,\-]?\s*(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?))?\s*:?\s*$/i;

const ISO_DAY_HEADER = /^(?:#{1,3}\s*)?(\d{4}-\d{2}-\d{2})\s*:?\s*$/;

const MDY_DAY_HEADER =
  /^(?:#{1,3}\s*)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\s*:?\s*$/;

const SEGMENT_HEADER =
  /^(?:#{1,3}\s*)?(?:strength|weightlifting|metcon|wod|amrap|emom|for\s*time|skill|warmup|warm[\s\-]?up|hiit|accessory|conditioning)\b/i;

const SEP_LINE = /^-{3,}$|^\*{3,}$|^={3,}$/;

function normalizeDow(token: string): number | null {
  const key = token.toLowerCase().replace(/\./g, "");
  return WEEKDAY_SHORT[key] ?? null;
}

function resolveDateFromWeekday(weekStart: Date, dowMon0: number): Date {
  // weekStart is Monday when weekStartsOn: 1
  return addDays(weekStart, dowMon0);
}

function tryParseFlexibleDate(raw: string, weekStart: Date): Date | null {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = parse(raw, "yyyy-MM-dd", weekStart);
    return isValid(d) ? d : null;
  }
  const mdy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (mdy) {
    const month = Number(mdy[1]);
    const day = Number(mdy[2]);
    let year = mdy[3] ? Number(mdy[3]) : weekStart.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    return isValid(d) ? d : null;
  }
  return null;
}

/**
 * Split a pasted week (or multi-day) block into day sections.
 * Unlabeled leading text attaches to the first day of the week (Monday).
 */
export function splitWeekPaste(raw: string, weekStart: Date): DayPasteBlock[] {
  const anchor = startOfWeek(weekStart, { weekStartsOn: 1 });
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: { date: Date; label: string; lines: string[] }[] = [];
  let current: { date: Date; label: string; lines: string[] } | null = null;

  const pushCurrent = () => {
    if (!current) return;
    const text = current.lines.join("\n").trim();
    if (text) {
      blocks.push({ date: current.date, label: current.label, lines: [...current.lines] });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    let matchedDate: Date | null = null;
    let label = trimmed;

    const iso = trimmed.match(ISO_DAY_HEADER);
    if (iso) {
      matchedDate = tryParseFlexibleDate(iso[1], anchor);
      label = iso[1];
    }

    if (!matchedDate) {
      const mdy = trimmed.match(MDY_DAY_HEADER);
      if (mdy) {
        matchedDate = tryParseFlexibleDate(trimmed.replace(/:$/, ""), anchor);
        label = trimmed.replace(/:$/, "");
      }
    }

    if (!matchedDate) {
      const day = trimmed.match(DAY_HEADER);
      if (day) {
        const token = trimmed.match(
          /\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        );
        if (token) {
          const dow = normalizeDow(token[1]);
          if (dow != null) {
            matchedDate = resolveDateFromWeekday(anchor, dow);
            label = format(matchedDate, "EEE MMM d");
            if (day[1]) {
              const withDate = tryParseFlexibleDate(day[1], anchor);
              if (withDate) {
                matchedDate = withDate;
                label = format(matchedDate, "EEE MMM d");
              }
            }
          }
        }
      }
    }

    if (matchedDate) {
      pushCurrent();
      current = { date: matchedDate, label, lines: [] };
      continue;
    }

    if (!current) {
      current = {
        date: anchor,
        label: format(anchor, "EEE MMM d"),
        lines: [],
      };
    }
    current.lines.push(line);
  }
  pushCurrent();

  // Merge duplicate dateKeys (same day appears twice)
  const byKey = new Map<string, DayPasteBlock>();
  for (const b of blocks) {
    const dateKey = format(b.date, "yyyy-MM-dd");
    const text = b.lines.join("\n").trim();
    const existing = byKey.get(dateKey);
    if (existing) {
      existing.rawText = `${existing.rawText}\n\n${text}`.trim();
    } else {
      byKey.set(dateKey, { dateKey, label: b.label, rawText: text });
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

/**
 * Split one day's text into segment blocks (Strength / Metcon / blank+header / ---).
 * If no segment headers, returns a single block.
 */
export function splitDayIntoSegments(dayRaw: string): string[] {
  const lines = dayRaw.replace(/\r\n/g, "\n").split("\n");
  const segments: string[][] = [];
  let current: string[] = [];

  const flush = () => {
    const t = current.join("\n").trim();
    if (t) segments.push([...current]);
    current = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isSep = SEP_LINE.test(trimmed);
    const isSegHeader = SEGMENT_HEADER.test(trimmed);
    const prevBlank = i > 0 && lines[i - 1].trim() === "";

    if (isSep) {
      flush();
      continue;
    }

    if (isSegHeader && current.length > 0 && (prevBlank || current.join("\n").trim().length > 0)) {
      // Start new segment when we hit a typed header after content
      if (current.join("\n").trim()) flush();
    }

    current.push(line);
  }
  flush();

  return segments.length ? segments.map((s) => s.join("\n").trim()) : dayRaw.trim() ? [dayRaw.trim()] : [];
}

/** Full pipeline: week paste → per-day segments ready to parse. */
export function splitWeekPasteIntoSegments(raw: string, weekStart: Date): SegmentPasteBlock[] {
  const days = splitWeekPaste(raw, weekStart);
  const out: SegmentPasteBlock[] = [];
  for (const day of days) {
    const segs = splitDayIntoSegments(day.rawText);
    segs.forEach((seg, idx) => {
      out.push({
        dateKey: day.dateKey,
        dayLabel: day.label,
        rawText: seg,
        segmentIndex: idx,
      });
    });
  }
  return out;
}

export function weekDayLabels(weekStart: Date): { dateKey: string; label: string }[] {
  const anchor = startOfWeek(weekStart, { weekStartsOn: 1 });
  return WEEKDAY_NAMES.map((_, i) => {
    const d = addDays(anchor, i);
    return { dateKey: format(d, "yyyy-MM-dd"), label: format(d, "EEE MMM d") };
  });
}
