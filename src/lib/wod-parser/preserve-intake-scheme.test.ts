import { describe, expect, it } from "vitest";
import type { IntakeDraftPayload } from "@/hooks/staff/types";
import { defaultSchemeForMetconFormat } from "@/lib/programming/workout-scheme-schema";
import { preserveIntakeWorkoutScheme } from "./preserve-intake-scheme";

function aiDraft(patch: Partial<IntakeDraftPayload["segment"]> = {}): IntakeDraftPayload {
  return {
    segment: {
      name: "Workout",
      description: null,
      programming_segment: "metcon",
      metcon_format: "amrap",
      athlete_notes: null,
      coaches_notes: null,
      display_order: 0,
      program_library_id: "lib-1",
      program_library_ids: ["lib-1"],
      items: [],
      ...patch,
    },
    lineItems: [
      {
        sequence_number: 1,
        reps_prescribed: 10,
        prescribed_weight: null,
        prescribed_percentage: null,
        prescribed_score: null,
        benchmark_type_id: null,
        bench_name: "Thruster",
      },
    ],
    warnings: [],
  };
}

describe("preserveIntakeWorkoutScheme", () => {
  it("keeps AMRAP 20 instead of the save default of 12", () => {
    expect(defaultSchemeForMetconFormat("amrap")).toMatchObject({ timeCapMin: 12 });
    const next = preserveIntakeWorkoutScheme(
      aiDraft(),
      "AMRAP 20:\n10 thrusters\n10 pull-ups",
    );
    expect(next.segment.workout_scheme).toMatchObject({
      kind: "amrap",
      timeCapMin: 20,
      scoreMetric: "rounds_reps",
    });
  });

  it("reads a minute-first AMRAP header and a later line under a Metcon label", () => {
    const minuteFirst = preserveIntakeWorkoutScheme(
      aiDraft(),
      "20 minute AMRAP\n15 wall balls\n10 toes-to-bar",
    );
    expect(minuteFirst.segment.workout_scheme).toMatchObject({ kind: "amrap", timeCapMin: 20 });

    const laterLine = preserveIntakeWorkoutScheme(
      aiDraft({ metcon_format: null }),
      "Metcon\nAMRAP 15\n10 thrusters",
    );
    expect(laterLine.segment.metcon_format).toBe("amrap");
    expect(laterLine.segment.workout_scheme).toMatchObject({ kind: "amrap", timeCapMin: 15 });
  });

  it("keeps RFT rounds when AI stores the format as for_time", () => {
    expect(defaultSchemeForMetconFormat("for_time")).toMatchObject({ kind: "for_time" });
    const next = preserveIntakeWorkoutScheme(
      aiDraft({ metcon_format: "for_time" }),
      "5 RFT:\n20 wall balls\n15 pull-ups",
    );
    expect(next.segment.workout_scheme).toMatchObject({ kind: "rft", rounds: 5 });
  });

  it("keeps EMOM minutes instead of the save default of 10", () => {
    expect(defaultSchemeForMetconFormat("emom")).toMatchObject({ minutes: 10 });
    const next = preserveIntakeWorkoutScheme(
      aiDraft({ metcon_format: "emom" }),
      "EMOM 12:\n10 cal row\n8 burpees",
    );
    expect(next.segment.workout_scheme).toMatchObject({ kind: "emom", minutes: 12 });

    const minuteFirst = preserveIntakeWorkoutScheme(
      aiDraft({ metcon_format: "emom" }),
      "12-min EMOM\n5 deadlifts",
    );
    expect(minuteFirst.segment.workout_scheme).toMatchObject({ kind: "emom", minutes: 12 });
  });

  it("does not replace a scheme already on the draft", () => {
    const next = preserveIntakeWorkoutScheme(
      aiDraft({
        workout_scheme: { kind: "amrap", timeCapMin: 8, scoreMetric: "rounds_reps" },
      }),
      "AMRAP 20:\n10 thrusters",
    );
    expect(next.segment.workout_scheme).toMatchObject({ timeCapMin: 8 });
  });

  it("does not override a format the coach changed in the draft", () => {
    const next = preserveIntakeWorkoutScheme(
      aiDraft({ metcon_format: "for_time" }),
      "AMRAP 20:\n10 thrusters",
    );
    expect(next.segment.workout_scheme).toBeUndefined();
  });

  it("leaves strength drafts alone", () => {
    const draft = aiDraft({
      programming_segment: "weightlifting",
      metcon_format: null,
      name: "Back Squat",
    });
    const next = preserveIntakeWorkoutScheme(draft, "Back Squat 5x3 @ 80%");
    expect(next).toBe(draft);
  });
});
