import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';

import { AuthProvider } from './AuthProvider';
import SignInPage from './SignInPage';

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
  roles: [],
};

function renderSignIn(initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/sign-in']) {
  return render(
    <ConfigProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/agent" element={<h1>Agent Landing</h1>} />
            <Route path="/custom" element={<h1>Custom Target</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ConfigProvider>,
  );
}

describe('SignInPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders localized labels', () => {
    renderSignIn();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
  });

  it('validation errors block submit', async () => {
    renderSignIn();

    // Empty fields: the schema's min-length check on email fires before its
    // format check, so this exercises "required", not "invalid format" —
    // see the next test for the email-format message.
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findAllByText('This field is required.')).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows the email-format error for a non-empty malformed email', async () => {
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('displays auth.errors.invalidCredentials on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ code: 'invalid_credentials', message: 'nope' }, 401));

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('navigates to /agent on success when there is no state.from', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Agent Landing' })).toBeInTheDocument();
  });

  it('navigates to state.from on success when present', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderSignIn([{ pathname: '/sign-in', state: { from: '/custom' } }]);
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Custom Target' })).toBeInTheDocument();
  });
});
