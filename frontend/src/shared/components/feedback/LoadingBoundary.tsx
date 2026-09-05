import { useEffect, useRef, useState, type ReactNode } from 'react';

const DEFAULT_MIN_DURATION = 300;

/**
 * Returns `true` while `loading` is `true`, and keeps returning `true` for
 * at least `minDuration` ms after `loading` flips to `false` — even if
 * `loading` was only `true` for less than one animation frame — so a
 * skeleton/spinner never flashes for a single frame. Shared by
 * `LoadingBoundary` and `AsyncBoundary`.
 */
export function useMinDurationLoading(loading: boolean, minDuration: number = DEFAULT_MIN_DURATION): boolean {
  const [show, setShow] = useState(loading);
  const startedAtRef = useRef<number | null>(loading ? performance.now() : null);

  useEffect(() => {
    if (loading) {
      if (startedAtRef.current === null) {
        startedAtRef.current = performance.now();
      }
      setShow(true);
      return;
    }

    const startedAt = startedAtRef.current ?? performance.now();
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, minDuration - elapsed);

    const timeoutId = setTimeout(() => {
      startedAtRef.current = null;
      setShow(false);
    }, remaining);

    return () => clearTimeout(timeoutId);
  }, [loading, minDuration]);

  return show;
}

export interface LoadingBoundaryProps {
  loading: boolean;
  /** Minimum time (ms) the fallback stays visible once shown. Default 300. */
  minDuration?: number;
  /** Usually a `<Skeleton />` shaped like the content it stands in for. */
  fallback: ReactNode;
  children: ReactNode;
}

/** Holds `fallback` for at least `minDuration` ms after `loading` flips to `false` (AC10). */
export function LoadingBoundary({ loading, minDuration = DEFAULT_MIN_DURATION, fallback, children }: LoadingBoundaryProps) {
  const show = useMinDurationLoading(loading, minDuration);
  return <>{show ? fallback : children}</>;
}
