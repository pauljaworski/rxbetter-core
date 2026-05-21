import type { EditorLineItem, EditorWod } from "@/hooks/staff/types";
import { normalizePercentFraction } from "@/lib/programming/percent-calculator";
import {
  METCON_FORMATS,
  normalizeMetconFormat,
  normalizeProgrammingSegment,
  type MetconFormat,
  type ProgrammingSegment,
} from "@/lib/wod-parser/intake-draft-schema";

export type LineItemMode = "prescription" | "tracking_only";

export type ManualProgrammingType = {
  uiKey: string;
  label: string;
  dbSegment: ProgrammingSegment;
  requiresFormat: boolean;
  lineItemMode: LineItemMode;
};

/** User-facing programming types mapped to DB `programming_segment`. */
export const MANUAL_PROGRAMMING_TYPES: ManualProgrammingType[] = [
  { uiKey: "warmup", label: "Warm-up", dbSegment: "skill", requiresFormat: false, lineItemMode: "tracking_only" },
  { uiKey: "skill", label: "Skill", dbSegment: "skill", requiresFormat: false, lineItemMode: "prescription" },
  { uiKey: "strength", label: "Strength", dbSegment: "weightlifting", requiresFormat: false, lineItemMode: "prescription" },
  {
    uiKey: "weightlifting",
    label: "Weightlifting",
    dbSegment: "weightlifting",
    requiresFormat: false,
    lineItemMode: "prescription",
  },
  { uiKey: "metcon", label: "Metcon", dbSegment: "metcon", requiresFormat: true, lineItemMode: "tracking_only" },
  { uiKey: "hiit", label: "HIIT", dbSegment: "metcon", requiresFormat: true, lineItemMode: "tracking_only" },
  { uiKey: "bodyweight", label: "Bodyweight", dbSegment: "bodyweight", requiresFormat: false, lineItemMode: "tracking_only" },
  { uiKey: "accessory", label: "Accessory", dbSegment: "bodyweight", requiresFormat: false, lineItemMode: "tracking_only" },
  { uiKey: "cooldown", label: "Cool-down", dbSegment: "skill", requiresFormat: false, lineItemMode: "tracking_only" },
];

export const METCON_FORMAT_OPTIONS: { value: MetconFormat; label: string }[] = [
  { value: "for_time", label: "For Time / RFT" },
  { value: "amrap", label: "AMRAP" },
  { value: "emom", label: "EMOM" },
  { value: "chipper", label: "Chipper" },
];

export type CatalogEntry = {
  id: string;
  name: string;
  stimulus: string | null;
  sub_stimulus?: string | null;
  purpose_variation?: string | null;
};

const STRENGTH_SUB_STIMULI = new Set(["clean", "jerk", "press", "pull", "snatch", "squat"]);

/** Named benchmark WODs (full workouts), not individual movements. */
const BENCHMARK_WOD_NAMES = new Set(
  [
    "Fran",
    "Annie",
    "Grace",
    "Isabel",
    "Helen",
    "Karen",
    "Nancy",
    "Elizabeth",
    "Diane",
    "Angie",
    "Barbara",
    "Chelsea",
    "Cindy",
    "Mary",
    "Murph",
    "Eva",
    "Eva Eva",
    "Fight Gone Bad",
    "Filthy Fifty",
  ].map((n) => n.toLowerCase()),
);

export function getTypeByUiKey(uiKey: string): ManualProgrammingType | undefined {
  return MANUAL_PROGRAMMING_TYPES.find((t) => t.uiKey === uiKey);
}

export function getTypeByDbSegment(segment: string): ManualProgrammingType | undefined {
  const db = normalizeProgrammingSegment(segment);
  return (
    MANUAL_PROGRAMMING_TYPES.find((t) => t.dbSegment === db && t.uiKey === db) ??
    MANUAL_PROGRAMMING_TYPES.find((t) => t.dbSegment === db)
  );
}

export function getLineItemMode(programmingSegment: string): LineItemMode {
  const t = getTypeByDbSegment(programmingSegment);
  return t?.lineItemMode ?? "prescription";
}

export function requiresMetconFormat(programmingSegment: string): boolean {
  const seg = normalizeProgrammingSegment(programmingSegment);
  return seg === "metcon";
}

export function isNamedBenchmarkWod(entry: CatalogEntry): boolean {
  if (entry.stimulus !== "metcon") return false;
  const name = entry.name.trim().toLowerCase();
  if (BENCHMARK_WOD_NAMES.has(name)) return true;
  const pv = (entry.purpose_variation ?? "").toLowerCase();
  return pv.includes("girl") || pv.includes("hero") || pv.includes("benchmark");
}

export function filterBenchmarkCatalog(catalog: CatalogEntry[], programmingSegment: string): CatalogEntry[] {
  const seg = normalizeProgrammingSegment(programmingSegment);

  if (seg === "weightlifting") {
    return catalog.filter(
      (e) =>
        e.stimulus === "strength" ||
        (e.sub_stimulus != null && STRENGTH_SUB_STIMULI.has(e.sub_stimulus)),
    );
  }

  if (seg === "skill") {
    return catalog.filter((e) => e.stimulus === "skill");
  }

  if (seg === "metcon" || seg === "bodyweight") {
    return catalog.filter((e) => e.stimulus !== "metcon" && !isNamedBenchmarkWod(e));
  }

  return catalog.filter((e) => !isNamedBenchmarkWod(e));
}

export function canAddMovement(wod: Pick<EditorWod, "programming_segment" | "metcon_format">): boolean {
  if (!wod.programming_segment) return false;
  if (requiresMetconFormat(wod.programming_segment) && !wod.metcon_format) return false;
  return true;
}

export function movementDisplayName(item: EditorLineItem): string {
  return item.bench_name ?? item.movement_label ?? "Movement";
}

export function validateEditorWod(wod: EditorWod): string | null {
  const name = (wod.name ?? "").trim();
  if (!name) return "Segment name is required.";
  if (!wod.items.length) return "Add at least one programming line item.";
  const libs = wod.program_library_ids?.length
    ? wod.program_library_ids
    : wod.program_library_id
      ? [wod.program_library_id]
      : [];
  if (!libs.length) return "Select at least one program track.";
  if (requiresMetconFormat(wod.programming_segment) && !wod.metcon_format) {
    return "Metcon and HIIT segments require a format (For Time, AMRAP, etc.).";
  }
  for (const it of wod.items) {
    if (!it.benchmark_type_id && !(it.movement_label ?? "").trim()) {
      return "Each movement needs a name (library pick or New movement label).";
    }
  }
  if (wod.programming_segment === "weightlifting") {
    const missing = wod.items.some((it) => !it.benchmark_type_id);
    if (missing) return "Weightlifting movements must be linked to the catalog.";
  }
  return null;
}

/** Normalize segment + format before save. */
export function normalizeEditorWodFields(wod: EditorWod): EditorWod {
  const segment = normalizeProgrammingSegment(wod.programming_segment);
  const format = requiresMetconFormat(segment)
    ? normalizeMetconFormat(wod.metcon_format)
    : null;
  const mode = getLineItemMode(segment);
  const items = wod.items.map((it) => ({
    ...it,
    prescribed_score: mode === "tracking_only" ? null : it.prescribed_score,
    prescribed_percentage: normalizePercentFraction(it.prescribed_percentage),
  }));
  const ids =
    wod.program_library_ids?.length > 0
      ? wod.program_library_ids
      : wod.program_library_id
        ? [wod.program_library_id]
        : [];
  return {
    ...wod,
    programming_segment: segment,
    metcon_format: format,
    program_library_ids: ids,
    program_library_id: ids[0] ?? wod.program_library_id,
    items,
  };
}

export { METCON_FORMATS, normalizeMetconFormat, normalizeProgrammingSegment };
