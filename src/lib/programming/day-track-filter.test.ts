import { describe, expect, it } from "vitest";
import { collectDayTracks, filterWodsByTrack } from "./day-track-filter";

describe("day-track-filter", () => {
  const libs = [
    { id: "cf", name: "CrossFit" },
    { id: "hx", name: "Hyrox" },
    { id: "pf", name: "Performance" },
  ];

  it("collects tracks present on the day", () => {
    expect(
      collectDayTracks(
        [
          { id: "1", program_library_ids: ["cf"] },
          { id: "2", program_library_ids: ["pf", "cf"] },
          { id: "3", source: "athlete_custom", program_library_ids: ["hx"] },
        ],
        libs,
      ).map((t) => t.name),
    ).toEqual(["CrossFit", "Performance"]);
  });

  it("filters to a single track", () => {
    const wods = [
      { id: "1", program_library_ids: ["cf"] },
      { id: "2", program_library_ids: ["pf"] },
      { id: "3", source: "athlete_custom" as const, program_library_ids: [] },
    ];
    expect(filterWodsByTrack(wods, "pf").map((w) => w.id)).toEqual(["2", "3"]);
    expect(filterWodsByTrack(wods, "all")).toHaveLength(3);
  });
});
