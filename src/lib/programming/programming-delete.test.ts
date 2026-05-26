import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { deleteProgrammingSegment } from "./programming-delete";

function chain(res: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  for (const m of ["update", "delete", "eq", "select", "is", "in"]) {
    c[m] = vi.fn(() => c);
  }
  c.then = undefined;
  Object.assign(c, res);
  return c;
}

describe("deleteProgrammingSegment", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("returns error when delete removes zero rows", async () => {
    mockFrom
      .mockReturnValueOnce(chain({ error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }));

    const result = await deleteProgrammingSegment("prog-1");
    expect(result.error).toMatch(/could not be deleted/i);
  });

  it("succeeds when a row is deleted", async () => {
    mockFrom
      .mockReturnValueOnce(chain({ error: null }))
      .mockReturnValueOnce(chain({ data: [{ id: "prog-1" }], error: null }));

    const result = await deleteProgrammingSegment("prog-1");
    expect(result.error).toBeNull();
  });
});
