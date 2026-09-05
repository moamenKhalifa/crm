import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@app/store/appStore';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider, getAccessToken } from '@shared/api';
import { useApiData } from '@shared/hooks';

import { AuthProvider, useAuth, type AuthContextValue } from './AuthProvider';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const TOKENS = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  token_type: 'Bearer' as const,
  access_expires_in: 900,
  refresh_expires_in: 1_209_600,
};

const ME = {
  id: 'user-1',
  email: 'agent@example.com',
  full_name: 'Agent Example',
  is_active: true,
  is_customer: false,
  roles: [{ id: 'role-1', name: 'agent', description: null }],
  permissions: [] as string[],
};

function renderAuth(strict = false) {
  let captured!: AuthContextValue;
  function Capture() {
    captured = useAuth();
    return null;
  }
  const tree = (
    <ConfigProvider>
      <AuthProvider>
        <Capture />
      </AuthProvider>
    </ConfigProvider>
  );
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return () => captured;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
    useAppStore.getState().clearSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('status starts unknown and resolves to anonymous when no refresh token is stored (AC1)', async () => {
    // The bootstrap effect resolves synchronously (within the same `act()`
    // flush as `render()`) when no bridge token exists, so `status` may
    // already be 'anonymous' by the time `render()` returns — the
    // initial-value guarantee itself is asserted by the `useState('unknown')`
    // default in `AuthProvider`; what's observable here is the end state.
    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    expect(getAuth().user).toBeNull();
  });

  it('signIn posts to /auth/login, stores the session, and updates the app store', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse({ ...ME, permissions: ['User.View'] });
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));

    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });

    await waitFor(() => expect(getAuth().status).toBe('authenticated'));
    expect(getAuth().user?.email).toBe('agent@example.com');
    expect(getAuth().roles).toEqual(['agent']);
    expect(getAuth().permissions).toEqual(['User.View']);
    expect(useAppStore.getState().user?.email).toBe('agent@example.com');
    expect(getAccessToken()).toBe('access-1');
  });

  it('regression: sign-in succeeds for a role without Role.View — permissions come from /auth/me, not a per-role /roles/{id}/permissions fan-out', async () => {
    // Previously, resolving the signed-in user's own effective permissions
    // fanned out to `GET /roles/{id}/permissions`, which requires
    // `Role.View` on the backend. Any user whose role lacked `Role.View`
    // (i.e. most non-admin roles) got a 403 during login itself and could
    // never sign in. `/auth/me` now returns `permissions` directly and is
    // gated only by being authenticated — asserting no `/roles/` call is
    // made here is exactly what would have caught that bug.
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse({ ...ME, permissions: ['User.View'] });
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));

    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });

    await waitFor(() => expect(getAuth().status).toBe('authenticated'));
    expect(getAuth().permissions).toEqual(['User.View']);
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).includes('/roles/'))).toBe(false);
  });

  it('signOut posts to /auth/logout, clears the token store, and resolves status to anonymous', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));

    await act(async () => {
      await getAuth().signOut();
    });

    expect(getAuth().status).toBe('anonymous');
    expect(getAccessToken()).toBeUndefined();
    expect(useAppStore.getState().user).toBeNull();
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/auth/logout'))).toBe(true);
  });

  it('mounts with a stored refresh token, refreshes exactly once, fetches /me, and becomes authenticated (AC2)', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    let refreshCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return jsonResponse(TOKENS);
      }
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    // Rendered under StrictMode so the dev-only mount→cleanup→remount cycle
    // actually exercises the `bootstrapped` guard this test is asserting on.
    const getAuth = renderAuth(true);

    await waitFor(() => expect(getAuth().status).toBe('authenticated'));
    expect(getAuth().user).not.toBeNull();
    expect(getAuth().roles).toEqual(['agent']);
    expect(refreshCalls).toBe(1);
  });

  it('refresh() returns false on 401, clears the token store, and does not throw', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse({ code: 'invalid_refresh_token', message: 'nope' }, 401);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));

    let result: boolean | undefined;
    await act(async () => {
      result = await getAuth().refresh();
    });

    expect(result).toBe(false);
    expect(getAccessToken()).toBeUndefined();
    expect(getAuth().status).toBe('anonymous');
  });

  it('never logs the password', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Sup3rSecret!' });
    });

    for (const call of consoleSpy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain('Sup3rSecret!');
    }
    consoleSpy.mockRestore();
  });

  it('a 4xx refresh failure on bootstrap clears the session immediately', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse({ error: { code: 'invalid_refresh_token', message: 'nope' } }, 401);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();

    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    expect(getAuth().user).toBeNull();
  });

  it('a network failure on bootstrap keeps status unknown, then retries once (after 2s) and succeeds', async () => {
    // Spying on `setTimeout` and invoking the captured callback directly
    // (rather than `vi.useFakeTimers()`) sidesteps a known incompatibility
    // between fake timers and Testing Library's `waitFor` polling loop.
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    let refreshCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        if (refreshCalls === 1) {
          throw new TypeError('Failed to fetch');
        }
        return jsonResponse(TOKENS);
      }
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();

    await waitFor(() => expect(refreshCalls).toBe(1));
    expect(getAuth().status).toBe('unknown');
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);

    // `waitFor` above also calls the (spied) global `setTimeout` for its own
    // polling loop, so find the retry call specifically by its 2000ms delay
    // rather than assuming index 0.
    const retryCall = timeoutSpy.mock.calls.find(([, delay]) => delay === 2000);
    const retryCallback = retryCall?.[0] as () => void;
    retryCallback();

    await waitFor(() => expect(getAuth().status).toBe('authenticated'));
    timeoutSpy.mockRestore();
  });

  it('reloadAuthContext is a no-op when anonymous', async () => {
    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));

    await act(async () => {
      await getAuth().reloadAuthContext();
    });

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    expect(getAuth().status).toBe('anonymous');
  });

  it('reloadAuthContext re-issues /auth/me + permissions and updates roles/permissions when authenticated', async () => {
    let meCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) {
        meCalls += 1;
        return jsonResponse(
          meCalls === 1
            ? ME
            : { ...ME, roles: [{ id: 'role-2', name: 'admin', description: null }], permissions: ['User.View'] },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));
    expect(getAuth().roles).toEqual(['agent']);

    await act(async () => {
      await getAuth().reloadAuthContext();
    });

    expect(getAuth().roles).toEqual(['admin']);
    expect(getAuth().permissions).toEqual(['User.View']);
  });

  it('rememberMe: true persists the refresh token to localStorage (AC7)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!', rememberMe: true });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));

    expect(window.localStorage.getItem('crm.rt')).toBe('refresh-1');
  });

  it('rememberMe: false (default) never writes the refresh token to localStorage (AC8)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));

    expect(window.localStorage.getItem('crm.rt')).toBeNull();
  });

  it('bootstraps back to authenticated on reload when a localStorage token exists, else stays anonymous', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));
  });

  it('signOut bumps the shared useApiData cache generation', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      throw new Error(`unexpected fetch: ${url}`);
    });

    const fetchFn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    function CacheProbe() {
      const result = useApiData({ fetch: fetchFn });
      return <span data-testid="cache-data">{String(result.data ?? '')}</span>;
    }

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));

    render(
      <ConfigProvider>
        <ApiClientProvider baseUrl="/api">
          <CacheProbe />
        </ApiClientProvider>
      </ConfigProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('cache-data')).toHaveTextContent('first'));

    await act(async () => {
      await getAuth().signOut();
    });

    await waitFor(() => expect(screen.getByTestId('cache-data')).toHaveTextContent('second'));
  });

  it('pageshow with event.persisted=true and no stored token forces status to anonymous (AC15)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().status).toBe('authenticated'));

    // Simulate a sibling tab having already cleared the persisted session
    // while this tab was frozen in bfcache.
    window.localStorage.removeItem('crm.rt');

    const pageShowEvent = new Event('pageshow');
    Object.defineProperty(pageShowEvent, 'persisted', { value: true });
    act(() => {
      window.dispatchEvent(pageShowEvent);
    });

    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
  });
});
