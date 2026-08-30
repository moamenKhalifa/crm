import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './ApiError';
import { HttpClient } from './httpClient';

describe('HttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prepends the base URL to the request path', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    );

    const client = new HttpClient({ baseUrl: '/api' });
    await client.get('/health');

    expect(fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }));
  });

  it('calls the auth header supplier and injects the returned token', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const getAuthorizationHeader = vi.fn(() => 'Bearer token-123');

    const client = new HttpClient({ baseUrl: '/api', getAuthorizationHeader });
    await client.get('/me');

    expect(getAuthorizationHeader).toHaveBeenCalled();
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
  });

  it('converts a non-2xx response into an ApiError with the correct status', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'missing' }), { status: 404 }),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    } satisfies Partial<ApiError>);
  });

  it('converts a network failure into an ApiError with code NETWORK_ERROR', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/health')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    } satisfies Partial<ApiError>);
  });

  it('retries once with the new token when onUnauthorized returns true', async () => {
    let callCount = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ code: 'unauthenticated', message: 'x' }), { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    let token = 'old-token';
    const client = new HttpClient({
      baseUrl: '/api',
      getAuthorizationHeader: () => `Bearer ${token}`,
      onUnauthorized: async () => {
        token = 'new-token';
        return true;
      },
    });

    const result = await client.get<{ ok: boolean }>('/me');

    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(2);
    const secondCallHeaders = vi.mocked(fetch).mock.calls[1][1]?.headers as Record<string, string>;
    expect(secondCallHeaders.Authorization).toBe('Bearer new-token');
  });

  it('throws when onUnauthorized returns false', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'unauthenticated', message: 'nope' }), { status: 401 }),
    );

    const client = new HttpClient({
      baseUrl: '/api',
      onUnauthorized: async () => false,
    });

    await expect(client.get('/me')).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
    expect(fetch).toHaveBeenCalledTimes(1); // no retry
  });

  it('shares a single in-flight refresh across concurrent 401s', async () => {
    // Each distinct URL 401s on its first call and succeeds on retry —
    // isolates "did each request retry" from "was refresh called once".
    const seenUrls = new Set<string>();
    let resolveRefresh!: (value: boolean) => void;
    const onUnauthorized = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        return new Response(JSON.stringify({ code: 'unauthenticated', message: 'x' }), { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const client = new HttpClient({ baseUrl: '/api', onUnauthorized });

    const first = client.get('/a');
    const second = client.get('/b');

    // Flush the macrotask queue so both requests reach `refreshOnce()`
    // (past their fetch-then-status-check microtasks) before resolving.
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveRefresh(true);

    await Promise.all([first, second]);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
