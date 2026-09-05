import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './ApiError';
import { HttpClient } from './httpClient';
import { __resetTokenStoreForTests, setAccessToken } from './tokenStore';

describe('HttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    __resetTokenStoreForTests();
  });

  it('prepends the base URL to the request path', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    );

    const client = new HttpClient({ baseUrl: '/api' });
    await client.get('/health');

    expect(fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }));
  });

  it('attaches Authorization when a token is set and the endpoint is not public (AC4)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    setAccessToken('token-123');

    const client = new HttpClient({ baseUrl: '/api' });
    await client.get('/identity/auth/me');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
  });

  it('omits Authorization when the request targets a different origin (AC5)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    setAccessToken('token-123');

    const client = new HttpClient({ baseUrl: '/api' });
    await client.get('https://example.com/anything');

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://example.com/anything');
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('omits Authorization on /identity/auth/login even when a token is set (AC6)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    setAccessToken('stale-token');

    const client = new HttpClient({ baseUrl: '/api' });
    await client.post('/identity/auth/login', { email: 'a@b.com', password: 'x' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
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

  it('calls onForbidden on a 403', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ code: 'FORBIDDEN', message: 'nope' }), { status: 403 }));
    const onForbidden = vi.fn();
    const client = new HttpClient({ baseUrl: '/api', onForbidden });

    await expect(client.get('/identity/roles')).rejects.toMatchObject({ status: 403 });

    expect(onForbidden).toHaveBeenCalledTimes(1);
  });

  it('skips onForbidden on a 403 when the caller passes suppressForbiddenHandling (optional picker lookups degrade locally instead of a global toast)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ code: 'FORBIDDEN', message: 'nope' }), { status: 403 }));
    const onForbidden = vi.fn();
    const client = new HttpClient({ baseUrl: '/api', onForbidden });

    await expect(
      client.get('/identity/roles', undefined, { suppressForbiddenHandling: true }),
    ).rejects.toMatchObject({ status: 403 });

    expect(onForbidden).not.toHaveBeenCalled();
  });

  it('unwraps the legacy backend error envelope { error: { code, message } }', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'duplicate_account', message: 'already exists' } }), {
        status: 409,
      }),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.post('/identity/auth/register', {})).rejects.toMatchObject({
      status: 409,
      code: 'duplicate_account',
      message: 'already exists',
    } satisfies Partial<ApiError>);
  });

  it('parses the future flat envelope { code, message, correlationId, fieldErrors }', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          correlationId: '8f2c',
          fieldErrors: [{ field: 'email', code: 'EMAIL_INVALID', message: 'bad email' }],
        }),
        { status: 422 },
      ),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.post('/x', {})).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_FAILED',
      correlationId: '8f2c',
      fieldErrors: [{ field: 'email', code: 'EMAIL_INVALID', message: 'bad email' }],
    } satisfies Partial<ApiError>);
  });

  it('still decodes a flat legacy { code, message } body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'legacy', message: 'flat shape' }), { status: 400 }),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/x')).rejects.toMatchObject({
      status: 400,
      code: 'legacy',
      message: 'flat shape',
    } satisfies Partial<ApiError>);
  });

  it('falls back to HTTP_<status> when the body has neither shape', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/x')).rejects.toMatchObject({
      status: 500,
      code: 'HTTP_500',
    } satisfies Partial<ApiError>);
  });

  it('reads correlationId from the X-Correlation-Id header when the body has none', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'X', message: 'x' }), {
        status: 500,
        headers: { 'X-Correlation-Id': 'header-correlation-id' },
      }),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/x')).rejects.toMatchObject({
      correlationId: 'header-correlation-id',
    } satisfies Partial<ApiError>);
  });

  it('converts a network failure into an ApiError with code NETWORK_ERROR and a synthesised correlationId', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/health')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    } satisfies Partial<ApiError>);

    try {
      await client.get('/health');
      throw new Error('expected rejection');
    } catch (error) {
      expect((error as ApiError).correlationId).toEqual(expect.any(String));
    }
  });

  it('parses Retry-After as seconds on a 429', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'RATE_LIMITED', message: 'slow down' }), {
        status: 429,
        headers: { 'Retry-After': '30' },
      }),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    await expect(client.get('/x')).rejects.toMatchObject({ retryAfterSeconds: 30 } satisfies Partial<ApiError>);
  });

  it('parses Retry-After as an HTTP-date on a 429', async () => {
    const futureDate = new Date(Date.now() + 60_000).toUTCString();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'RATE_LIMITED', message: 'slow down' }), {
        status: 429,
        headers: { 'Retry-After': futureDate },
      }),
    );

    const client = new HttpClient({ baseUrl: '/api' });

    try {
      await client.get('/x');
      throw new Error('expected rejection');
    } catch (error) {
      const retryAfterSeconds = (error as ApiError).retryAfterSeconds;
      expect(retryAfterSeconds).toBeGreaterThan(0);
      expect(retryAfterSeconds).toBeLessThanOrEqual(61);
    }
  });

  it('retries once with the refreshed token when onSessionExpired returns true', async () => {
    let callCount = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return new Response(JSON.stringify({ code: 'unauthenticated', message: 'x' }), { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    setAccessToken('old-token');
    const client = new HttpClient({
      baseUrl: '/api',
      onSessionExpired: async () => {
        setAccessToken('new-token');
        return true;
      },
    });

    const result = await client.get<{ ok: boolean }>('/identity/auth/me');

    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(2);
    const secondCallHeaders = vi.mocked(fetch).mock.calls[1][1]?.headers as Record<string, string>;
    expect(secondCallHeaders.Authorization).toBe('Bearer new-token');
  });

  it('throws when onSessionExpired returns false', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ code: 'unauthenticated', message: 'nope' }), { status: 401 }),
    );

    const client = new HttpClient({
      baseUrl: '/api',
      onSessionExpired: async () => false,
    });

    await expect(client.get('/identity/auth/me')).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
    expect(fetch).toHaveBeenCalledTimes(1); // no retry
  });

  it('shares a single in-flight refresh across concurrent 401s', async () => {
    // Each distinct URL 401s on its first call and succeeds on retry —
    // isolates "did each request retry" from "was refresh called once".
    const seenUrls = new Set<string>();
    let resolveRefresh!: (value: boolean) => void;
    const onSessionExpired = vi.fn(
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

    const client = new HttpClient({ baseUrl: '/api', onSessionExpired });

    const first = client.get('/a');
    const second = client.get('/b');

    // Flush the macrotask queue so both requests reach `refreshOnce()`
    // (past their fetch-then-status-check microtasks) before resolving.
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveRefresh(true);

    await Promise.all([first, second]);

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('put/patch/delete sugar methods hit the right verbs', async () => {
    vi.mocked(fetch).mockImplementation(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const client = new HttpClient({ baseUrl: '/api' });

    await client.put('/roles/1/permissions', { permission_ids: ['a'] });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/roles/1/permissions',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ permission_ids: ['a'] }) }),
    );

    await client.patch('/users/1', { full_name: 'New Name' });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/users/1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ full_name: 'New Name' }) }),
    );

    await client.delete('/users/1');
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/users/1', expect.objectContaining({ method: 'DELETE' }));
  });
});
