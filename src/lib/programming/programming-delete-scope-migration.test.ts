import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(cwd(), "supabase/migrations/20260602130500_lock_programming_delete_scope.sql"),
  "utf8",
);

describe("programming delete scope migration", () => {
  it("does not authorize deletes from gym role alone", () => {
    const helperBody = migration.slice(
      migration.indexOf("create or replace function public.staff_can_delete_programming"),
      migration.indexOf("comment on function public.staff_can_delete_programming"),
    );

    expect(helperBody).toContain("programming_library_assignment");
    expect(helperBody).toContain("not public.staff_can_manage_programming_library");
    expect(helperBody).toContain("staff_can_manage_unassigned_programming");
    expect(helperBody).not.toMatch(
      /has_active_fm_role\s*\([^)]*'programmer'[^)]*\)\s*or\s*public\.has_active_fm_role\s*\([^)]*'admin'/i,
    );
  });

  it("validates requested assignment tracks before deleting current assignments", () => {
    const syncBody = migration.slice(
      migration.indexOf("create or replace function public.sync_programming_library_assignments"),
      migration.indexOf("comment on function public.sync_programming_library_assignments"),
    );
    const requestedValidation = syncBody.indexOf("not public.staff_can_manage_programming_library");
    const assignmentDelete = syncBody.indexOf("delete from public.programming_library_assignment");

    expect(requestedValidation).toBeGreaterThan(-1);
    expect(assignmentDelete).toBeGreaterThan(-1);
    expect(requestedValidation).toBeLessThan(assignmentDelete);
  });
});
