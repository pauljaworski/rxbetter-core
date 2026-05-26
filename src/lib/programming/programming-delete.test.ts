import { describe, expect, it, vi, beforeEach } from "vitest";

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
