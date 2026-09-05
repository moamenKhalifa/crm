import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { LocaleProvider } from '@shared/i18n';
import { ThemeProvider } from '@shared/theme';

import { AuthProvider } from './AuthProvider';
import RegisterPage from './RegisterPage';

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
  email: 'new@example.com',
  full_name: 'New Person',
  is_active: true,
  is_customer: true,
  roles: [],
};

function renderRegister() {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider>
          <AuthProvider>
            <ApiClientProvider baseUrl="/api">
              <MemoryRouter initialEntries={['/register']}>
                <Routes>
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/agent" element={<h1>Agent Landing</h1>} />
                  <Route path="/sign-in" element={<h1>Sign in</h1>} />
                </Routes>
              </MemoryRouter>
            </ApiClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'New Person' } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'Passw0rd!' } });
  fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: 'Passw0rd!' } });
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders full name, email, password, and confirm-password fields', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/)).toBeInTheDocument();
  });

  it('renders the LanguageSwitcher above the card, in a banner landmark (AC8)', () => {
    renderRegister();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'العربية' })).toBeInTheDocument();
  });

  it('blocks submit on an empty form', async () => {
    renderRegister();

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findAllByText('This field is required.')).not.toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows a mismatch error when passwords differ', async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'New Person' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: 'Different1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('registers, navigates to /agent, and clears the password fields on success', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/register')) return jsonResponse(ME, 201);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(ME);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Agent Landing' })).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/auth/register'))).toBe(
      true,
    );
  });

  it('shows a duplicate-account message on 409', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'duplicate_account', message: 'exists' } }, 409),
    );

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
  });

  it('shows a generic validation message on a 422 backend validation error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'validation_failed', message: 'weak password' } }, 422),
    );

    renderRegister();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Please review the highlighted fields.')).toBeInTheDocument();
  });

  it('both password fields keep distinct autoComplete values for password managers', () => {
    renderRegister();
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText(/Confirm password/)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('validates on blur, then live thereafter (AC8)', async () => {
    renderRegister();

    fireEvent.blur(screen.getByLabelText(/Full name/));
    expect(await screen.findAllByText('This field is required.')).not.toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'New Person' } });
    await waitFor(() => expect(screen.queryByText('This field is required.')).not.toBeInTheDocument());
  });

  it('focuses the first invalid field on a validation failure (AC8, G3)', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByLabelText(/Full name/)).toHaveFocus());
  });

  it('installs the unsaved-changes guard once the user starts typing (AC15)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderRegister();

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'N' } });
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();
  });

  it('the submit button is disabled while submitting and a second click does not fire twice', async () => {
    let resolveRegister!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRegister = resolve;
        }),
    );

    renderRegister();
    fillValidForm();
    const submitButton = screen.getByRole('button', { name: 'Create account' });

    fireEvent.click(submitButton);
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(fetch).toHaveBeenCalledTimes(1);

    resolveRegister(jsonResponse(ME, 201));
  });
});
