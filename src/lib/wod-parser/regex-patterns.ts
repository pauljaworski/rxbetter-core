const MOVEMENT = "[A-Za-z][\\w\\s.'\\-/]*?";

/** Strength: Back Squat 5x3 @ 80% (optional "+" before scheme) */
export const STRENGTH_SETS_REPS_PCT =
  new RegExp(
    `^(${MOVEMENT})\\s*(?:\\+\\s*)?(\\d+)\\s*x\\s*(\\d+)\\s*@\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*$`,
    "i",
  );

/** Strength: Back Squat 5x3 65,70,75,80,85% (percent ladder per set) */
export const STRENGTH_SETS_REPS_LADDER =
  new RegExp(
    `^(${MOVEMENT})\\s*(?:\\+\\s*)?(\\d+)\\s*x\\s*(\\d+)\\s+([\\d%,.\\s/]+)\\s*$`,
    "i",
  );

/** Strength: Back Squat 5x3 (no @ — sets only) */
export const STRENGTH_SETS_REPS = new RegExp(
  `^(${MOVEMENT})\\s*(?:\\+\\s*)?(\\d+)\\s*x\\s*(\\d+)\\s*$`,
  "i",
);

/** Strength: Deadlift 3 @ 225 or 3 @ 225lb */
export const STRENGTH_REPS_AT_WEIGHT =
  new RegExp(
    `^(${MOVEMENT})\\s*(?:\\+\\s*)?(\\d+)\\s*@\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lb|lbs|#)?\\s*$`,
    "i",
  );

/** Sets x reps without movement prefix on same line: 5x3 @ 80% */
export const SETS_REPS_PCT = /^(\d+)\s*x\s*(\d+)\s*(?:@\s*(\d+(?:\.\d+)?)\s*%)?\s*$/i;

export const METCON_KEYWORDS =
  /\b(amrap|for\s+time|emom|rft|tabata|chipper|every\s+\d+|e\d+m\d+)\b/i;
