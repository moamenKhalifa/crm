import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseAsyncResult<T, Args extends unknown[]> {
  status: AsyncStatus;
  data: T | undefined;
  error: unknown;
  run(...args: Args): Promise<T | undefined>;
  reset(): void;
}

export function useAsync<T, Args extends unknown[] = []>(
  fn: (...args: Args) => Promise<T>,
  deps: DependencyList = [],
): UseAsyncResult<T, Args> {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>(undefined);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const run = useCallback(
    async (...args: Args) => {
      setStatus('loading');
      setError(undefined);
      try {
        const result = await fn(...args);
        if (mounted.current) {
          setData(result);
          setStatus('success');
        }
        return result;
      } catch (caught) {
        if (mounted.current) {
          setError(caught);
          setStatus('error');
        }
        return undefined;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setData(undefined);
    setError(undefined);
  }, []);

  return { status, data, error, run, reset };
}
