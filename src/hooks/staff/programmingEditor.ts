import type { EditorWod } from "./types";

export const PROGRAMMING_SEGMENTS = [
  { value: "warmup", label: "Warm-up" },
  { value: "skill", label: "Skill" },
  { value: "strength", label: "Strength" },
  { value: "weightlifting", label: "Weightlifting" },
  { value: "metcon", label: "Metcon" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "accessory", label: "Accessory" },
  { value: "cooldown", label: "Cooldown" },
] as const;

export const METCON_FORMATS = ["amrap", "for_time", "emom", "rft", "tabata", "chipper"] as const;

const PROGRAMMING_SEGMENT_VALUES = new Set<string>(PROGRAMMING_SEGMENTS.map((segment) => segment.value));
const METCON_FORMAT_VALUES = new Set<string>(METCON_FORMATS);

export function validateProgrammingEditorInput(wods: EditorWod[]): string | null {
  for (const [idx, wod] of wods.entries()) {
    const label = wod.name?.trim() || `Segment ${idx + 1}`;

    if (!PROGRAMMING_SEGMENT_VALUES.has(wod.programming_segment)) {
      return `${label} uses an unsupported segment type.`;
    }

    if (wod.metcon_format && !METCON_FORMAT_VALUES.has(wod.metcon_format)) {
      return `${label} uses an unsupported metcon format.`;
    }
  }

  return null;
}
