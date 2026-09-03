import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';

import { AuthenticatedShell } from './AuthenticatedShell';
import { AuthProvider, useAuth } from './AuthProvider';

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

function LoginPageStub() {
  const [searchParams] = useSearchParams();
  return (
    <>
      <h1>Sign in</h1>
      {searchParams.get('signedOut') === '1' && <p>signedOut param present</p>}
    </>
  );
}

function SignInTrigger() {
  const { signIn } = useAuth();
  return (
    <button type="button" onClick={() => void signIn({ email: 'agent@example.com', password: 'Passw0rd!' })}>
      sign in
    </button>
  );
}

function renderShell() {
  return render(
    <ConfigProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/agent']}>
          <Routes>
            <Route
              path="/agent"
              element={
                <>
                  <SignInTrigger />
                  <AuthenticatedShell>
                    <h1>Agent</h1>
                  </AuthenticatedShell>
                </>
              }
            />
            <Route path="/login" element={<LoginPageStub />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ConfigProvider>,
  );
}

describe('AuthenticatedShell', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the signed-in user and signing out navigates to /login?signedOut=1', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      if (url.includes('/roles/')) return jsonResponse([]);
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'sign in' }));

    await waitFor(() => expect(screen.getByText('Agent Example')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Agent Example' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('signedOut param present')).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/auth/logout'))).toBe(true);
  });
});
