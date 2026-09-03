import { useCallback, useEffect, useRef, useState } from 'react';

import { useApiClient, type HttpClient } from '@shared/api';

export interface UseApiDataOptions<T> {
  fetch(client: HttpClient): Promise<T>;
  deps?: unknown[];
}

export interface UseApiDataResult<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  reload(): void;
}

// Module-scoped generation counter shared by every `useApiData` call site —
// the CRUD screens' whole "server-state cache". Bumping it (e.g. on
// sign-out, see `AuthProvider.signOut`) forces every currently-mounted
// instance to re-fetch, without either a global cache object or pulling in
// TanStack Query.
let cacheGeneration = 0;
const generationListeners = new Set<() => void>();

export function bumpCacheGeneration(): void {
  cacheGeneration += 1;
  for (const listener of generationListeners) {
    listener();
  }
}

/** Shared list/detail fetch primitive for the admin CRUD screens. Does not toast on error — callers decide. */
export function useApiData<T>({ fetch, deps = [] }: UseApiDataOptions<T>): UseApiDataResult<T> {
  const client = useApiClient();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [generation, setGeneration] = useState(cacheGeneration);

  useEffect(() => {
    // Reset on every mount, not just declared once via `useRef(true)` — in
    // React 18 StrictMode's dev-only mount→cleanup→remount cycle, the
    // cleanup below runs during the synthetic unmount and this effect body
    // is what undoes it on the real remount. Without the reset here,
    // `mounted.current` stays `false` forever and every fetch that resolves
    // afterwards is silently dropped, leaving the UI stuck on "Loading…"
    // even though the request actually succeeded.
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const listener = () => {
      if (mounted.current) {
        setGeneration(cacheGeneration);
      }
    };
    generationListeners.add(listener);
    return () => {
      generationListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(undefined);
    void (async () => {
      try {
        const result = await fetch(client);
        if (mounted.current) {
          setData(result);
          setIsLoading(false);
        }
      } catch (caught) {
        if (mounted.current) {
          setError(caught);
          setIsLoading(false);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, reloadToken, generation, ...deps]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { data, error, isLoading, reload };
}
