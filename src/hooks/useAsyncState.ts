import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  /** True while re-fetching after the first successful load. */
  isRefreshing: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => void;
};

export function useAsyncState<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  initial: T,
  isEmpty: (data: T) => boolean = (d) => {
    if (Array.isArray(d)) return d.length === 0;
    return d == null;
  },
): AsyncState<T> {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const hasLoadedOnce = useRef(false);
  const prevDepsRef = useRef<unknown[] | null>(null);
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const initialLoad = !hasLoadedOnce.current;
    const depsChanged =
      prevDepsRef.current == null ||
      prevDepsRef.current.length !== deps.length ||
      prevDepsRef.current.some((d, i) => !Object.is(d, deps[i]));
    prevDepsRef.current = deps.slice();

    if (initialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
      // Drop stale data when the query identity changes (e.g. programming date),
      // so callers don't briefly keep the previous day's segments.
      if (depsChanged) {
        setData(initialRef.current);
      }
    }
    setError(null);
    (async () => {
      try {
        const result = await loader();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          if (depsChanged) setData(initialRef.current);
        }
      } finally {
        if (!cancelled) {
          hasLoadedOnce.current = true;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    isEmpty: !isLoading && !isRefreshing && !error && isEmpty(data),
    refetch,
  };
}
