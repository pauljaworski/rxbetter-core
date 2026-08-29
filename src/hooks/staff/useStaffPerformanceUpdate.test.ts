import { describe, expect, it } from "vitest";
import {
  STAFF_SCORE_UPDATE_DENIED,
  staffPerformanceUpdateApplied,
} from "./useStaffPerformanceUpdate";

describe("staffPerformanceUpdateApplied", () => {
  it("treats a returned row as a successful write", () => {
    expect(staffPerformanceUpdateApplied([{ id: "perf-1" }])).toBe(true);
  });

  it("treats an empty RLS-filtered update as a failed write", () => {
    expect(staffPerformanceUpdateApplied([])).toBe(false);
    expect(staffPerformanceUpdateApplied(null)).toBe(false);
    expect(staffPerformanceUpdateApplied(undefined)).toBe(false);
  });

  it("exposes a coach-facing denial when the write is dropped", () => {
    expect(STAFF_SCORE_UPDATE_DENIED).toMatch(/wasn't saved/i);
  });
});
