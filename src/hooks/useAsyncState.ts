import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> = {
  data: T;
  isLoading: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const hasLoadedOnce = useRef(false);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const showLoading = !hasLoadedOnce.current;
    if (showLoading) setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const result = await loader();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          hasLoadedOnce.current = true;
          setIsLoading(false);
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
    error,
    isEmpty: !isLoading && !error && isEmpty(data),
    refetch,
  };
}
