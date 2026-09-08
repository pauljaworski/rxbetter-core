export const PRESCRIPTION_UNITS = ["reps", "meters", "calories", "feet", "seconds"] as const;

export type PrescriptionUnit = (typeof PRESCRIPTION_UNITS)[number];

export const PRESCRIPTION_UNIT_LABELS: Record<PrescriptionUnit, string> = {
  reps: "reps",
  meters: "meters",
  calories: "calories",
  feet: "feet",
  seconds: "time (m:ss)",
};

export function isPrescriptionUnit(v: string): v is PrescriptionUnit {
  return (PRESCRIPTION_UNITS as readonly string[]).includes(v);
}

/** Format seconds as m:ss (e.g. 60 → "1:00", 45 → "0:45"). */
export function formatDurationSeconds(sec: number | null | undefined): string | null {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return null;
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Parse "1:00", "0:60", ":45", or plain seconds into seconds. */
export function parseDurationSeconds(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return Math.min(7200, Math.max(0, Number(t)));
  const mmss = t.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (mmss) {
    const m = Number(mmss[1]);
    const s = Number(mmss[2]);
    // Allow 0:60 style (60 seconds) as well as strict mm:ss
    if (s > 99) return null;
    return Math.min(7200, m * 60 + s);
  }
  const colonOnly = t.match(/^:\s*(\d{1,2})$/);
  if (colonOnly) return Math.min(7200, Number(colonOnly[1]));
  return null;
}

export function formatPrescriptionAmount(
  amount: number | null | undefined,
  unit: PrescriptionUnit | string | null | undefined,
): string | null {
  if (amount == null) return null;
  const u = unit ?? "reps";
  switch (u) {
    case "meters":
      return `${amount}m`;
    case "calories":
      return `${amount} cal`;
    case "feet":
      return `${amount} ft`;
    case "seconds": {
      const formatted = formatDurationSeconds(amount);
      return formatted ? formatted : null;
    }
    case "sets":
      return `${amount} ${amount === 1 ? "set" : "sets"}`;
    default:
      return `${amount} ${amount === 1 ? "Rep" : "Reps"}`;
  }
}

export function inferUnitFromToken(token: string): {
  amount: number | null;
  unit: PrescriptionUnit;
  label: string;
} {
  const t = token.trim();
  const timeFirst = t.match(/^(\d+)\s*:\s*(\d{1,2})\s+(.+)$/);
  if (timeFirst) {
    const sec = Number(timeFirst[1]) * 60 + Number(timeFirst[2]);
    return { amount: sec, unit: "seconds", label: timeFirst[3].trim() };
  }
  const secFirst = t.match(/^(\d+)\s*(?:s|sec|secs|seconds)\s+(.+)$/i);
  if (secFirst) {
    return { amount: Number(secFirst[1]), unit: "seconds", label: secFirst[2].trim() };
  }
  const distanceM = t.match(/^(\d+)\s*m(?:eter)?s?\s+(.+)$/i);
  if (distanceM) {
    return { amount: Number(distanceM[1]), unit: "meters", label: distanceM[2].trim() };
  }
  const distanceFt = t.match(/^(\d+)\s*(?:ft|feet)\s+(.+)$/i);
  if (distanceFt) {
    return { amount: Number(distanceFt[1]), unit: "feet", label: distanceFt[2].trim() };
  }
  const cal = t.match(/^(\d+)\s*(?:\/\d+\s*)?cal(?:ories)?\s+(.+)$/i);
  if (cal) {
    return { amount: Number(cal[1]), unit: "calories", label: cal[2].trim() };
  }
  const repsFirst = t.match(/^(\d+)\s+(.+)$/);
  if (repsFirst) {
    return { amount: Number(repsFirst[1]), unit: "reps", label: repsFirst[2].trim() };
  }
  return { amount: null, unit: "reps", label: t };
}
