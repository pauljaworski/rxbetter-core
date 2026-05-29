import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(),
  },
}));

import { deleteProgrammingSegment } from "./programming-delete";

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
});

describe("programming track-scope migration", () => {
  const sql = readFileSync(
    new URL(
      "../../../supabase/migrations/20260529130500_lock_programming_track_scope_and_history.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("checks every existing and requested track before replacing assignments", () => {
    const authCheck = sql.indexOf(
      "if not public.staff_can_manage_programming_libraries(v_gym, v_affected) then",
    );
    const assignmentDelete = sql.indexOf("delete from public.programming_library_assignment");

    expect(sql).toContain("select pla.program_library_id");
    expect(sql).toContain("where pla.programming_id = p_programming_id");
    expect(authCheck).toBeGreaterThan(-1);
    expect(assignmentDelete).toBeGreaterThan(authCheck);
  });

  it("unpublishes published or history-bearing segments instead of hard deleting them", () => {
    const preserveHistory = sql.indexOf("if v_published_at is not null or v_has_history then");
    const hardDelete = sql.indexOf("delete from public.programming_line_item");

    expect(sql).toContain("from public.athlete_performance ap");
    expect(sql).toContain("from public.athlete_segment_completion asc_row");
    expect(sql).toContain("set published_at = null");
    expect(preserveHistory).toBeGreaterThan(-1);
    expect(hardDelete).toBeGreaterThan(preserveHistory);
  });

  it("uses the all-track guard for programming and line-item writes", () => {
    expect(sql).toContain("create policy pli_insert on public.programming_line_item");
    expect(sql).toContain("and public.staff_can_manage_programming (programming_id)");
    expect(sql).toContain(
      "if public.staff_can_manage_programming_libraries(new.gym_id, v_library_ids) then",
    );
    expect(sql).toContain(
      "if public.staff_can_manage_programming_libraries(v_gym, v_library_ids) then",
    );
  });
});
