import { describe, expect, it, vi } from "vitest";
import { POSTGREST_PAGE_SIZE, pageAllRows } from "./page-all-rows";

describe("pageAllRows", () => {
  it("returns a single short page", async () => {
    const fetchPage = vi.fn(async () => ({
      data: [{ id: "a" }, { id: "b" }],
      error: null,
    }));

    const { data, error } = await pageAllRows(fetchPage, 1000);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: "a" }, { id: "b" }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(0, 999);
  });

  it("pages until a short page so rows past max_rows are not dropped", async () => {
    const page1 = Array.from({ length: POSTGREST_PAGE_SIZE }, (_, i) => ({ id: `id-${i}` }));
    const page2 = [{ id: "id-late-pr" }];
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null });

    const { data, error } = await pageAllRows<{ id: string }>(fetchPage);
    expect(error).toBeNull();
    expect(data).toHaveLength(POSTGREST_PAGE_SIZE + 1);
    expect(data[POSTGREST_PAGE_SIZE]?.id).toBe("id-late-pr");
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 999);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1000, 1999);
  });

  it("surfaces the first page error", async () => {
    const fetchPage = vi.fn(async () => ({
      data: null,
      error: { message: "boom" },
    }));
    const { data, error } = await pageAllRows(fetchPage);
    expect(data).toEqual([]);
    expect(error).toBe("boom");
  });
});
