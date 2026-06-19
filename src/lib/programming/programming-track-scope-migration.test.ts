import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(cwd(), "supabase/migrations/20260603130500_lock_programming_track_scope_and_history.sql"),
  "utf8",
);

function functionBody(start: string, end: string): string {
  const startIdx = migration.indexOf(start);
  const endIdx = migration.indexOf(end);
  expect(startIdx).toBeGreaterThanOrEqual(0);
  expect(endIdx).toBeGreaterThan(startIdx);
  return migration.slice(startIdx, endIdx);
}

describe("programming track scope migration", () => {
  it("requires current track access before parent programming updates", () => {
    const body = functionBody(
      "create or replace function public.trg_enforce_programming_update",
      "create or replace function public.trg_enforce_pli_update",
    );

    expect(body).toContain("not public.staff_can_manage_programming_tracks(old.id)");
    expect(body).toContain("public.staff_can_manage_programming_library(v_gym, v_lib)");
  });

  it("requires current track access before shared line-item updates", () => {
    const body = functionBody(
      "create or replace function public.trg_enforce_pli_update",
      "-- ---------------------------------------------------------------------------\n-- Delete policies and destructive RPCs",
    );

    expect(body).toContain("public.staff_can_manage_programming_tracks(new.programming_id)");
    expect(body).not.toMatch(/has_staff_library_scope\s*\([^)]*v_lib[^)]*staff_programmer/is);
  });

  it("validates requested assignment tracks before deleting current assignments", () => {
    const body = functionBody(
      "create or replace function public.sync_programming_library_assignments",
      "comment on function public.sync_programming_library_assignments",
    );
    const requestedValidation = body.indexOf("not public.staff_can_manage_programming_library");
    const assignmentDelete = body.indexOf("delete from public.programming_library_assignment");

    expect(requestedValidation).toBeGreaterThan(-1);
    expect(assignmentDelete).toBeGreaterThan(-1);
    expect(requestedValidation).toBeLessThan(assignmentDelete);
  });

  it("unpublishes published or history-bearing segments instead of deleting them", () => {
    const body = functionBody(
      "create or replace function public.delete_gym_programming_segment",
      "comment on function public.delete_gym_programming_segment",
    );
    const historyCheck = body.indexOf("v_has_history");
    const unpublish = body.indexOf("set published_at = null");
    const hardDelete = body.indexOf("delete from public.programming");

    expect(body).toContain("public.athlete_performance");
    expect(body).toContain("public.athlete_segment_completion");
    expect(historyCheck).toBeGreaterThan(-1);
    expect(unpublish).toBeGreaterThan(historyCheck);
    expect(hardDelete).toBeGreaterThan(unpublish);
  });
});
