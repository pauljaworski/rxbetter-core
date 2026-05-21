import { describe, expect, it } from "vitest";
import { isProgrammingVisibleForTracks } from "./athlete-library-filter";

describe("isProgrammingVisibleForTracks", () => {
  const assignmentMap = new Map<string, string[]>([
    ["prog-a", ["lib-1"]],
    ["prog-b", []],
  ]);

  it("shows all programming when athlete has no track subscriptions", () => {
    expect(
      isProgrammingVisibleForTracks({ id: "prog-a", program_library_id: "lib-1" }, assignmentMap, []),
    ).toBe(true);
  });

  it("shows track-assigned programming when library matches", () => {
    expect(
      isProgrammingVisibleForTracks({ id: "prog-a", program_library_id: "lib-1" }, assignmentMap, [
        "lib-1",
      ]),
    ).toBe(true);
  });

  it("hides programming on other tracks", () => {
    expect(
      isProgrammingVisibleForTracks({ id: "prog-a", program_library_id: "lib-1" }, assignmentMap, [
        "lib-2",
      ]),
    ).toBe(false);
  });

  it("shows gym-wide programming with no library assignment", () => {
    expect(
      isProgrammingVisibleForTracks({ id: "prog-b", program_library_id: null }, assignmentMap, [
        "lib-1",
      ]),
    ).toBe(true);
  });
});
