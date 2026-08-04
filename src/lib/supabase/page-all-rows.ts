/** PostgREST silently truncates SELECT responses at `max_rows` (see supabase/config.toml). */
export const POSTGREST_PAGE_SIZE = 1000;

export type PageRangeResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/**
 * Exhaust a PostgREST-backed query by paging with stable `id` order.
 * `fetchPage(from, to)` must apply `.order("id").range(from, to)` (inclusive).
 */
export async function pageAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageRangeResult<T>>,
  pageSize: number = POSTGREST_PAGE_SIZE,
): Promise<{ data: T[]; error: string | null }> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) return { data: all, error: error.message };
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return { data: all, error: null };
}
