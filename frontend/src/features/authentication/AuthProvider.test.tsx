import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@app/store/appStore';
import { ConfigProvider } from '@app/configuration/ConfigProvider';

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
};

function renderAuth() {
  let captured!: AuthContextValue;
  function Capture() {
    captured = useAuth();
    return null;
  }
  render(
    <ConfigProvider>
      <AuthProvider>
        <Capture />
      </AuthProvider>
    </ConfigProvider>,
  );
  return () => captured;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    useAppStore.getState().clearSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signIn posts to /auth/login, stores the session, and updates the app store', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([{ id: 'perm-1', code: 'User.View', description: null }]);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));

    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });

    await waitFor(() => expect(getAuth().isAuthenticated).toBe(true));
    expect(getAuth().user?.email).toBe('agent@example.com');
    expect(getAuth().user?.permissions).toEqual(['User.View']);
    expect(useAppStore.getState().user?.email).toBe('agent@example.com');
    expect(useAppStore.getState().accessToken).toBe('access-1');
  });

  it('signOut posts to /auth/logout and clears the session', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([]);
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();
    await waitFor(() => expect(getAuth().status).toBe('anonymous'));
    await act(async () => {
      await getAuth().signIn({ email: 'agent@example.com', password: 'Passw0rd!' });
    });
    await waitFor(() => expect(getAuth().isAuthenticated).toBe(true));

    await act(async () => {
      await getAuth().signOut();
    });

    expect(getAuth().isAuthenticated).toBe(false);
    expect(useAppStore.getState().user).toBeNull();
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/auth/logout'))).toBe(true);
  });

  it('mounts with a stored refresh token, refreshes, fetches /me, and becomes authenticated', async () => {
    window.sessionStorage.setItem('crm.rt', 'stored-refresh-token');
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([]);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const getAuth = renderAuth();

    await waitFor(() => expect(getAuth().isAuthenticated).toBe(true));
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/auth/refresh'))).toBe(true);
  });

  it('refresh() returns false on 401 and does not throw', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([]);
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
    await waitFor(() => expect(getAuth().isAuthenticated).toBe(true));

    let result: boolean | undefined;
    await act(async () => {
      result = await getAuth().refresh();
    });

    expect(result).toBe(false);
  });

  it('never logs the password', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([]);
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
});
