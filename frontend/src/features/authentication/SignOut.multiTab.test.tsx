import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

function mountTab() {
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

describe('multi-tab sign-out (AC16)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signing out in one mount broadcasts, and a sibling mount that observes the broadcast transitions to anonymous within 2s', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([]);
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      throw new Error(`unexpected fetch: ${url}`);
    });

    // Two independent `AuthProvider` mounts standing in for two browser
    // tabs. jsdom (correctly, matching real browsers) never dispatches a
    // native `storage` event back to the *same* window that wrote the key,
    // so — same as a real cross-tab `storage` event a second real tab would
    // receive — this test dispatches it manually rather than relying on
    // `localStorage.setItem` to fire it automatically within one jsdom window.
    const getTabA = mountTab();
    const getTabB = mountTab();

    await waitFor(() => expect(getTabA().status).toBe('anonymous'));
    await waitFor(() => expect(getTabB().status).toBe('anonymous'));

    await act(async () => {
      await getTabA().signIn({ email: 'agent@example.com', password: 'Passw0rd!', rememberMe: true });
    });
    await waitFor(() => expect(getTabA().status).toBe('authenticated'));

    await act(async () => {
      await getTabB().signIn({ email: 'agent@example.com', password: 'Passw0rd!', rememberMe: true });
    });
    await waitFor(() => expect(getTabB().status).toBe('authenticated'));

    await act(async () => {
      await getTabA().signOut();
    });
    expect(getTabA().status).toBe('anonymous');

    // Simulate the `storage` event a real sibling tab receives when A's
    // `refreshBridge.broadcastSignOut()` writes the broadcast key.
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'crm.rt.broadcast', newValue: String(Date.now()) }));
    });

    await waitFor(() => expect(getTabB().status).toBe('anonymous'));
  });

  it('a broadcast is ignored by a tab that is already anonymous', async () => {
    const getTab = mountTab();
    await waitFor(() => expect(getTab().status).toBe('anonymous'));

    expect(() => {
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', { key: 'crm.rt.broadcast', newValue: String(Date.now()) }));
      });
    }).not.toThrow();

    expect(getTab().status).toBe('anonymous');
  });
});
