import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260531130500_lock_programming_delete_scope_and_history.sql"),
  "utf8",
);

describe("programming delete/sync migration guardrails", () => {
  it("requires staff to manage every currently assigned track before destructive actions", () => {
    expect(migration).toContain("create or replace function public.staff_can_manage_programming_tracks");
    expect(migration).toContain("where not public.staff_can_manage_programming_library");
    expect(migration).toContain("select public.staff_can_manage_programming_tracks(p_programming_id)");
  });

  it("validates requested assignment scope before deleting existing assignments", () => {
    const syncStart = migration.indexOf("create or replace function public.sync_programming_library_assignments");
    const syncBody = migration.slice(syncStart);
    const validationIndex = syncBody.indexOf("foreach v_lib in array v_requested_library_ids loop");
    const deleteIndex = syncBody.indexOf("delete from public.programming_library_assignment");

    expect(syncStart).toBeGreaterThan(-1);
    expect(validationIndex).toBeGreaterThan(-1);
    expect(deleteIndex).toBeGreaterThan(validationIndex);
    expect(syncBody).toContain("raise exception 'Not allowed to assign library %'");
  });

  it("unpublishes published or history-bearing segments instead of hard deleting them", () => {
    const unpublishIndex = migration.indexOf("if v_published_at is not null or v_has_history then");
    const hardDeleteIndex = migration.indexOf("delete from public.programming\n  where id = p_programming_id");

    expect(unpublishIndex).toBeGreaterThan(-1);
    expect(hardDeleteIndex).toBeGreaterThan(unpublishIndex);
    expect(migration).toContain("set published_at = null");
    expect(migration).toContain("from public.athlete_segment_completion");
  });

  it("enforces programming and assignment libraries stay in the same gym", () => {
    expect(migration).toContain("programming_library_gym_guard");
    expect(migration).toContain("programming_assignment_gym_guard");
    expect(migration).toContain("p.gym_id is distinct from pl.gym_id");
  });
});
