const MAX_CHARS = 2500;
const MIN_CHARS = 8;

const FITNESS_KEYWORDS =
  /\b(amrap|emom|rft|for\s+time|rounds?|reps?|sets?|squat|deadlift|clean|snatch|thruster|burpee|pull[- ]?up|push[- ]?up|box\s+jump|wall\s+ball|row|run|calories?|%\s*$|@\s*\d|\d+\s*%|\d+x\d|\d+\s*x\s*\d)/i;

const INJECTION_PATTERNS =
  /\b(ignore\s+(all\s+)?(previous|prior)|system\s+prompt|you\s+are\s+now|act\s+as\s+(a\s+)?chat)/i;

export function validateWorkoutInput(rawText: string): { ok: true } | { ok: false; message: string } {
  const text = rawText.trim();
  if (text.length < MIN_CHARS) {
    return { ok: false, message: "Workout text is too short." };
  }
  if (text.length > MAX_CHARS) {
    return { ok: false, message: `Workout text exceeds ${MAX_CHARS} characters.` };
  }
  if (INJECTION_PATTERNS.test(text)) {
    return { ok: false, message: "Paste workout programming only." };
  }
  if (!FITNESS_KEYWORDS.test(text)) {
    return { ok: false, message: "Paste workout programming only (AMRAP, sets/reps, movements)." };
  }
  return { ok: true };
}

export function truncateForModel(rawText: string, max = 2000): string {
  return rawText.trim().slice(0, max);
}
