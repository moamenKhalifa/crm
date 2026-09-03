import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApiClientProvider } from '@shared/api';

import { bumpCacheGeneration, useApiData } from './useApiData';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ApiClientProvider, { baseUrl: '/api', children });
}

describe('useApiData', () => {
  it('loads data on mount', async () => {
    const fetchFn = vi.fn().mockResolvedValue(['a', 'b']);
    const { result } = renderHook(() => useApiData({ fetch: fetchFn }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(['a', 'b']);
    expect(result.current.error).toBeUndefined();
  });

  it('captures a failure into error', async () => {
    const error = new Error('boom');
    const fetchFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApiData({ fetch: fetchFn }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it('reload() re-runs the fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const { result } = renderHook(() => useApiData({ fetch: fetchFn }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe('first'));

    result.current.reload();

    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not set state after unmount', async () => {
    let resolveFetch!: (value: string) => void;
    const fetchFn = vi.fn(() => new Promise<string>((resolve) => { resolveFetch = resolve; }));
    const { result, unmount } = renderHook(() => useApiData({ fetch: fetchFn }), { wrapper });

    unmount();
    resolveFetch('too-late');

    // No assertion beyond "does not throw" — the mounted-ref guard silently
    // drops the state update. React would otherwise warn/error.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.data).toBeUndefined();
  });

  it('bumpCacheGeneration() triggers a re-fetch on every subscribed hook (AC14)', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const { result } = renderHook(() => useApiData({ fetch: fetchFn }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe('first'));

    bumpCacheGeneration();

    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
