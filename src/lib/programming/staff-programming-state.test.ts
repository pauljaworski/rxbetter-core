import { describe, expect, it } from "vitest";
import {
  createBuyInMainCashOutDrafts,
  linkSegmentWithPrevious,
  moveSegmentInDay,
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

describe("moveSegmentInDay", () => {
  it("reorders parts inside a multi-part block", () => {
    const gid = "g1";
    const wods = [
      bareWod({ name: "Buy-in", segment_group_id: gid, display_order: 0 }),
      bareWod({
        name: "Main",
        segment_group_id: gid,
        group_score_anchor: true,
        display_order: 1,
      }),
      bareWod({ name: "Cash-out", segment_group_id: gid, display_order: 2 }),
    ];
    const next = moveSegmentInDay(wods, 1, "up");
    expect(next.map((w) => w.name)).toEqual(["Main", "Buy-in", "Cash-out"]);
    expect(next.map((w) => w.display_order)).toEqual([0, 1, 2]);
  });

  it("moves a whole block past a neighboring single", () => {
    const gid = "g1";
    const wods = [
      bareWod({ name: "Warm-up", display_order: 0 }),
      bareWod({ name: "Buy-in", segment_group_id: gid, display_order: 1 }),
      bareWod({
        name: "Main",
        segment_group_id: gid,
        group_score_anchor: true,
        display_order: 2,
      }),
    ];
    const next = moveSegmentInDay(wods, 1, "up");
    expect(next.map((w) => w.name)).toEqual(["Buy-in", "Main", "Warm-up"]);
  });

  it("moves a single past a whole block", () => {
    const gid = "g1";
    const wods = [
      bareWod({ name: "Buy-in", segment_group_id: gid, display_order: 0 }),
      bareWod({
        name: "Main",
        segment_group_id: gid,
        group_score_anchor: true,
        display_order: 1,
      }),
      bareWod({ name: "Cooldown-down", display_order: 2 }),
    ];
    const next = moveSegmentInDay(wods, 2, "up");
    expect(next.map((w) => w.name)).toEqual(["Cooldown-down", "Buy-in", "Main"]);
  });
});
