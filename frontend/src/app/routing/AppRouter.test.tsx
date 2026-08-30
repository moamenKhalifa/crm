import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@app/providers/AppProviders';

import { AppRouter } from './AppRouter';

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

function meFor(roleName: string) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'User Example',
    is_active: true,
    is_customer: false,
    roles: [{ id: 'role-1', name: roleName, description: null }],
  };
}

function mockAuthenticatedAs(roleName: string) {
  window.sessionStorage.setItem('crm.rt', 'stored-refresh-token');
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
    if (url.endsWith('/auth/me')) return jsonResponse(meFor(roleName));
    if (url.includes('/roles/')) return jsonResponse([]);
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe('AppRouter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends an anonymous visitor to /admin to /sign-in', async () => {
    window.history.pushState({}, '', '/admin');

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('sends an authenticated non-admin visiting /admin to /agent (via the / redirect)', async () => {
    window.history.pushState({}, '', '/admin');
    mockAuthenticatedAs('agent');

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Agent' })).toBeInTheDocument();
  });

  it('lets an admin through to /admin', async () => {
    window.history.pushState({}, '', '/admin');
    mockAuthenticatedAs('admin');

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();
  });
});
