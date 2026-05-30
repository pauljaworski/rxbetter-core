import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260530130500_lock_programming_track_scope_and_history.sql",
  ),
  "utf8",
);

describe("programming track-scope migration", () => {
  it("requires staff scope for every existing and requested track", () => {
    expect(migration).toContain("create or replace function public.staff_can_manage_programming");
    expect(migration).toContain("not public.staff_can_manage_programming_library");
    expect(migration).toContain("public.staff_can_manage_programming(p_programming_id, p_library_ids)");
    expect(migration).toContain("array[programming_library_assignment.program_library_id]");
  });

  it("preserves athlete history when staff remove published or logged segments", () => {
    expect(migration).toContain("if v_was_published or v_has_history then");
    expect(migration).toContain("set published_at = null");
    expect(migration).toContain("ap.programming_line_item_id in");
    expect(migration).toContain("athlete_segment_completion");
  });
});
