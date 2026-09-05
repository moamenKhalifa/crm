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

function meFor(roleName: string, permissions: string[]) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'User Example',
    is_active: true,
    is_customer: false,
    roles: [{ id: 'role-1', name: roleName, description: null }],
    permissions,
  };
}

function mockAuthenticatedAs(roleName: string, permissions: string[] = []) {
  window.localStorage.setItem('crm.rt', 'stored-refresh-token');
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
    if (url.endsWith('/auth/me')) return jsonResponse(meFor(roleName, permissions));
    if (url.includes('/identity/users')) return jsonResponse([]);
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe('AppRouter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
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

  it('sends an authenticated non-admin visiting /admin to /forbidden', async () => {
    window.history.pushState({}, '', '/admin');
    mockAuthenticatedAs('agent');

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    // AccessDenied (Story 15) renders its title as plain text, mirroring the
    // shared page-state panels rather than a semantic heading.
    expect(await screen.findByText("You don't have access to this")).toBeInTheDocument();
  });

  it('redirects /admin to /admin/users and renders it when the admin has User.View', async () => {
    window.history.pushState({}, '', '/admin');
    mockAuthenticatedAs('admin', ['User.View']);

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
  });

  it('bounces an admin missing User.View at /admin/users to /forbidden', async () => {
    window.history.pushState({}, '', '/admin/users');
    mockAuthenticatedAs('admin', []);

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByText("You don't have access to this")).toBeInTheDocument();
  });

  it('renders the register page and is reachable while unauthenticated', async () => {
    window.history.pushState({}, '', '/register');

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
  });

  it('AC3: while status is unknown, only the splash renders — no route content and no redirect', async () => {
    window.history.pushState({}, '', '/admin');
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
        <AppRouter />
      </AppProviders>,
    );

    expect(screen.getByTestId('app-splash')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByText("You don't have access to this")).not.toBeInTheDocument();

    // AC1: once bootstrap resolves (here, the stored token turns out to be
    // invalid), the splash is replaced by the redirect — never both at once.
    resolveRefresh(jsonResponse({ error: { code: 'invalid_refresh_token', message: 'nope' } }, 401));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByTestId('app-splash')).not.toBeInTheDocument();
  });

  it('AC2: with a valid bridge token, /admin/users renders after exactly one refresh, with no intermediate sign-in flash', async () => {
    window.history.pushState({}, '', '/admin/users');
    mockAuthenticatedAs('admin', ['User.View']);

    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>,
    );

    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Users', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.filter(([input]) => String(input).endsWith('/auth/refresh'))).toHaveLength(1);
  });
});
