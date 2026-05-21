import { describe, expect, it } from "vitest";
import {
  normalizeMetconFormat,
  normalizeProgrammingSegment,
  llmIntakeDraftSchema,
} from "./intake-draft-schema";

describe("intake-draft-schema", () => {
  it("maps strength to weightlifting", () => {
    expect(normalizeProgrammingSegment("strength")).toBe("weightlifting");
  });

  it("maps rft and tabata metcon aliases", () => {
    expect(normalizeMetconFormat("rft")).toBe("for_time");
    expect(normalizeMetconFormat("tabata")).toBe("for_time");
    expect(normalizeMetconFormat("amrap")).toBe("amrap");
  });

  it("parses minimal LLM JSON", () => {
    const r = llmIntakeDraftSchema.safeParse({
      segment: {
        name: "Metcon",
        programming_segment: "metcon",
        metcon_format: "amrap",
      },
      movements: [{ name: "Thruster", reps_prescribed: 10 }],
      warnings: [],
    });
    expect(r.success).toBe(true);
  });
});
