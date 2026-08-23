import { describe, expect, it } from "vitest";
import {
  PROGRAMMING_SEGMENT_DB_VALUES,
  resolveAthleteCustomPersist,
} from "./athlete-custom-workouts";
import { parseWorkoutScheme } from "./workout-scheme-schema";

describe("resolveAthleteCustomPersist", () => {
  it("maps Strength / Accessory / Warm-up to CHECK-safe DB segments", () => {
    expect(resolveAthleteCustomPersist("strength")).toMatchObject({
      programmingSegment: "weightlifting",
      programmingSubtype: "strength",
      lineItemKind: "strength_set",
    });
    expect(resolveAthleteCustomPersist("accessory")).toMatchObject({
      programmingSegment: "bodyweight",
      programmingSubtype: null,
      lineItemKind: "note",
    });
    expect(resolveAthleteCustomPersist("warmup")).toMatchObject({
      programmingSegment: "skill",
      programmingSubtype: null,
      lineItemKind: "note",
    });
  });

  it("keeps Weightlifting and Metcon on their DB values", () => {
    expect(resolveAthleteCustomPersist("weightlifting")).toMatchObject({
      programmingSegment: "weightlifting",
      programmingSubtype: "weightlifting",
      lineItemKind: "strength_set",
      metconFormat: null,
    });
    expect(resolveAthleteCustomPersist("metcon")).toMatchObject({
      programmingSegment: "metcon",
      programmingSubtype: null,
      lineItemKind: "metcon_movement",
      metconFormat: "amrap",
    });
  });

  it("never emits a programming_segment outside the DB CHECK", () => {
    for (const uiKey of ["strength", "weightlifting", "accessory", "warmup", "metcon", "hiit", ""]) {
      const persist = resolveAthleteCustomPersist(uiKey);
      expect(PROGRAMMING_SEGMENT_DB_VALUES).toContain(persist.programmingSegment);
    }
  });

  it("writes a parseable AMRAP scheme (timeCapMin, not durationMin)", () => {
    const scheme = resolveAthleteCustomPersist("metcon").workoutScheme;
    expect(scheme).not.toHaveProperty("durationMin");
    const parsed = parseWorkoutScheme(scheme);
    expect(parsed?.kind).toBe("amrap");
    expect(parsed && "timeCapMin" in parsed ? parsed.timeCapMin : null).toBe(20);
  });
});
