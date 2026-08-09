import { describe, expect, it, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  deleteProgrammingSegment,
  resolveLineItemIdsToDelete,
  syncDeletedLineItems,
} from "./programming-delete";

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

describe("resolveLineItemIdsToDelete", () => {
  it("deletes only locally removed IDs the editor knew about", () => {
    expect(
      resolveLineItemIdsToDelete(["a", "b", "c"], ["a"], ["a", "b"]),
    ).toEqual(["b"]);
  });

  it("does not delete concurrent inserts absent from the editor baseline", () => {
    // Stale tab still has a+b; another coach added c. Notes-only save must keep c.
    expect(
      resolveLineItemIdsToDelete(["a", "b", "c"], ["a", "b"], ["a", "b"]),
    ).toEqual([]);
  });

  it("deletes nothing when baseline is empty (new / duplicated segment)", () => {
    expect(resolveLineItemIdsToDelete(["a", "b"], [], [])).toEqual([]);
  });
});

describe("syncDeletedLineItems", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("scopes DELETE to known baseline IDs missing from kept", async () => {
    const selectEq = vi.fn().mockReturnValue({
      is: vi.fn().mockResolvedValue({
        data: [{ id: "a" }, { id: "b" }, { id: "concurrent" }],
        error: null,
      }),
    });
    const deleteIn = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: "b" }], error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      expect(table).toBe("programming_line_item");
      return {
        select: vi.fn().mockReturnValue({
          eq: selectEq,
        }),
        delete: vi.fn().mockReturnValue({
          in: deleteIn,
        }),
      };
    });

    // First from() is select path; second is delete path — mock both calls.
    let call = 0;
    mockFrom.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return {
          select: () => ({
            eq: () => ({
              is: async () => ({
                data: [{ id: "a" }, { id: "b" }, { id: "concurrent" }],
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        delete: () => ({
          in: (column: string, ids: string[]) => {
            expect(column).toBe("id");
            expect(ids).toEqual(["b"]);
            return {
              select: async () => ({ data: [{ id: "b" }], error: null }),
            };
          },
        }),
      };
    });

    const result = await syncDeletedLineItems("prog-1", ["a"], ["a", "b"]);
    expect(result.error).toBeNull();
    expect(call).toBe(2);
  });
});
