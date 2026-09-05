import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@features/authentication/AuthProvider';
import { useApiClient } from '@shared/api';

import { AppProviders } from './AppProviders';

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

function ProtectedCaller() {
  const client = useApiClient();
  const { status } = useAuth();
  return (
    <div>
      <p>status:{status}</p>
      <button type="button" onClick={() => void client.get('/protected').catch(() => {})}>
        call protected
      </button>
    </div>
  );
}

describe('AppProviders', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a 401 on a protected request that fails to refresh shows a session-expired toast and signs out', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    let refreshCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        if (refreshCalls === 1) return jsonResponse(TOKENS);
        return jsonResponse({ error: { code: 'invalid_refresh_token', message: 'nope' } }, 401);
      }
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      if (url.endsWith('/protected')) {
        return jsonResponse({ error: { code: 'invalid_credentials', message: 'expired' } }, 401);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    render(
      <AppProviders>
        <ProtectedCaller />
      </AppProviders>,
    );

    await waitFor(() => expect(screen.getByText('status:authenticated')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'call protected' }));

    expect(await screen.findByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('status:anonymous')).toBeInTheDocument());
  });

  it('provider order: AuthProvider sits above ApiClientProvider, and children render only once status resolves', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    let resolveRefresh!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        return new Promise<Response>((resolve) => {
          resolveRefresh = resolve;
        });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    render(
      <AppProviders>
        <ProtectedCaller />
      </AppProviders>,
    );

    // `ApiClientWithConfig` reads `useAuth()` for its callbacks, which only
    // works if `AuthProvider` is an ancestor — and `AppShell` (a descendant
    // of `ApiClientProvider`) withholds `children` while status is
    // 'unknown', so `ProtectedCaller` must not be in the tree yet.
    expect(screen.queryByText(/^status:/)).not.toBeInTheDocument();
    expect(screen.getByTestId('app-splash')).toBeInTheDocument();

    resolveRefresh(jsonResponse({ error: { code: 'invalid_refresh_token', message: 'nope' } }, 401));

    await waitFor(() => expect(screen.getByText('status:anonymous')).toBeInTheDocument());
  });
});
