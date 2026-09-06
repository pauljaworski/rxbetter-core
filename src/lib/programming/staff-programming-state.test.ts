import { describe, expect, it } from "vitest";
import {
  createBuyInMainCashOutDrafts,
  linkSegmentWithPrevious,
} from "./staff-programming-state";
import type { EditorWod } from "@/hooks/staff/types";

function bareWod(overrides: Partial<EditorWod> = {}): EditorWod {
  return {
    name: "Seg",
    description: null,
    programming_segment: "metcon",
    metcon_format: "for_time",
    athlete_notes: null,
    coaches_notes: null,
    display_order: 0,
    program_library_id: "lib",
    program_library_ids: ["lib"],
    items: [],
    segment_group_id: null,
    group_score_anchor: false,
    ...overrides,
  };
}

describe("linkSegmentWithPrevious", () => {
  it("creates a group and anchors the previous segment", () => {
    const wods = [bareWod({ name: "Buy-in" }), bareWod({ name: "Main", display_order: 1 })];
    const next = linkSegmentWithPrevious(wods, 1);
    expect(next[0].segment_group_id).toBeTruthy();
    expect(next[0].segment_group_id).toBe(next[1].segment_group_id);
    expect(next[0].group_score_anchor).toBe(true);
    expect(next[1].group_score_anchor).toBe(false);
  });

  it("joins an existing block without stealing the anchor", () => {
    const gid = "group-1";
    const wods = [
      bareWod({ name: "Buy-in", segment_group_id: gid, group_score_anchor: false }),
      bareWod({
        name: "Main",
        display_order: 1,
        segment_group_id: gid,
        group_score_anchor: true,
      }),
      bareWod({ name: "Cash-out", display_order: 2 }),
    ];
    const next = linkSegmentWithPrevious(wods, 2);
    expect(next[2].segment_group_id).toBe(gid);
    expect(next[1].group_score_anchor).toBe(true);
    expect(next[2].group_score_anchor).toBe(false);
  });
});

describe("createBuyInMainCashOutDrafts", () => {
  it("returns three linked parts with main as score anchor", () => {
    const drafts = createBuyInMainCashOutDrafts(0, ["lib-1"]);
    expect(drafts).toHaveLength(3);
    const gid = drafts[0].segment_group_id;
    expect(drafts.every((d) => d.segment_group_id === gid)).toBe(true);
    expect(drafts[1].group_score_anchor).toBe(true);
    expect(drafts[0].group_score_anchor).toBe(false);
    expect(drafts[2].group_score_anchor).toBe(false);
    expect(drafts[1].workout_scheme?.kind).toBe("rft");
  });
});
