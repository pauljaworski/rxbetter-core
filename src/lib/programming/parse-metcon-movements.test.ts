import { describe, expect, it } from "vitest";
import { parseMetconMovements } from "./parse-metcon-movements";

const catalog = [
  { id: "bt-wb", name: "Wall Ball", stimulus: "metcon", sub_stimulus: null, purpose_variation: null },
  { id: "bt-t2b", name: "Toes to Bar", stimulus: "metcon", sub_stimulus: null, purpose_variation: null },
];

describe("parseMetconMovements", () => {
  it("parses 3 RFT with movement list", () => {
    const r = parseMetconMovements(
      "3 RFT: 400m run, 20 Wall Balls, 15 T2B",
      catalog,
    );
    expect(r.metconFormat).toBe("for_time");
    expect(r.scheme?.kind).toBe("rft");
    if (r.scheme?.kind === "rft") expect(r.scheme.rounds).toBe(3);
    expect(r.movements.length).toBeGreaterThanOrEqual(2);
  });

  it("parses AMRAP header", () => {
    const r = parseMetconMovements("AMRAP 12\n10 Thrusters\n15 Pull-ups", catalog);
    expect(r.metconFormat).toBe("amrap");
    expect(r.scheme?.kind).toBe("amrap");
  });
});
