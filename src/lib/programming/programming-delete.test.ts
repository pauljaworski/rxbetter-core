import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import * as path from "node:path";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(),
  },
}));

import { deleteProgrammingSegment, syncProgrammingLibraryAssignments } from "./programming-delete";

describe("deleteProgrammingSegment", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("calls delete_gym_programming_segment RPC", async () => {
    mockRpc.mockResolvedValue({ error: null });

    const result = await deleteProgrammingSegment("prog-1");
    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("delete_gym_programming_segment", {
      p_programming_id: "prog-1",
    });
  });

  it("returns friendly error when not allowed", async () => {
    mockRpc.mockResolvedValue({
      error: { message: "Not allowed to delete this programming segment" },
    });

    const result = await deleteProgrammingSegment("prog-1");
    expect(result.error).toMatch(/could not be deleted/i);
  });

  it("calls assignment sync RPC with all selected tracks", async () => {
    mockRpc.mockResolvedValue({ error: null });

    const result = await syncProgrammingLibraryAssignments("prog-1", ["track-a", "track-b"]);
    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("sync_programming_library_assignments", {
      p_programming_id: "prog-1",
      p_library_ids: ["track-a", "track-b"],
    });
  });
});

describe("programming delete/sync migration", () => {
  const migration = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20260528130500_lock_programming_delete_and_assignment_scope.sql",
    ),
    "utf8",
  );

  it("requires scope for every affected track before syncing assignments", () => {
    expect(migration).toContain("staff_can_manage_programming_libraries");
    expect(migration).toContain("where pl.id = l.lib_id");
    expect(migration).toContain("where not (");
    expect(migration).toContain("v_affected");
    expect(migration).toContain("create policy programming_insert");
    expect(migration).toContain("create or replace function public.trg_enforce_programming_update");
  });

  it("unpublishes published or history-bearing segments instead of hard-deleting them", () => {
    expect(migration).toContain("v_published_at is not null or v_has_history");
    expect(migration).toContain("set published_at = null");
    expect(migration).toContain("public.athlete_performance");
    expect(migration).toContain("public.athlete_segment_completion");
  });
});
