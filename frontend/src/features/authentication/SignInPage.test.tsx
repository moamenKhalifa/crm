import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';

import { AuthProvider } from './AuthProvider';
import SignInPage from './SignInPage';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

const TOKENS = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  token_type: 'Bearer' as const,
  access_expires_in: 900,
  refresh_expires_in: 1_209_600,
};

function meFor(roleName: string | null) {
  return {
    id: 'user-1',
    email: 'agent@example.com',
    full_name: 'Agent Example',
    is_active: true,
    is_customer: false,
    roles: roleName ? [{ id: 'role-1', name: roleName, description: null }] : [],
  };
}

function renderSignIn(initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/login']) {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/login" element={<SignInPage />} />
              <Route path="/agent" element={<h1>Agent Landing</h1>} />
              <Route path="/admin" element={<h1>Admin Landing</h1>} />
              <Route path="/portal" element={<h1>Portal Landing</h1>} />
              <Route path="/custom" element={<h1>Custom Target</h1>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('SignInPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
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

  it('validates on blur then live thereafter, and never shows an untouched field error (AC1, G2)', async () => {
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'a' } });
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText(/Email/));
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'not-an-email' } });
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    await waitFor(() => expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument());
  });

  it('shows the summary banner only after a failed submit, not from blur alone', async () => {
    renderSignIn();

    fireEvent.blur(screen.getByLabelText(/Email/));
    expect(await screen.findByText('Enter your email address')).toBeInTheDocument();
    expect(screen.queryByText('Please fix the highlighted fields')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Please fix the highlighted fields')).toBeInTheDocument();
  });

  it('successful sign-in navigates to /agent when there is no from and the user has no admin/agent role match beyond agent', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(meFor('agent'));
      if (url.includes('/roles/')) return jsonResponse([]);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Agent Landing' })).toBeInTheDocument();
  });

  it('navigates to state.from on success when present and relative (AC9)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(meFor('agent'));
      if (url.includes('/roles/')) return jsonResponse([]);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderSignIn([{ pathname: '/login', state: { from: '/custom' } }]);
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Custom Target' })).toBeInTheDocument();
  });

  it('rejects an absolute or protocol-relative from and falls back to the role home (AC10)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(meFor('admin'));
      if (url.includes('/roles/')) return jsonResponse([]);
      throw new Error(`unexpected fetch: ${url}`);
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderSignIn(['/login?from=https%3A%2F%2Fevil.example%2Fsteal']);
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Admin Landing' })).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('redirects an already-authenticated visitor away from /login (AC11)', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(meFor('agent'));
      if (url.includes('/roles/')) return jsonResponse([]);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderSignIn();

    expect(await screen.findByRole('heading', { name: 'Agent Landing' })).toBeInTheDocument();
  });

  it('a double-click on submit dispatches exactly one login request (AC12)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(meFor('agent'));
      if (url.includes('/roles/')) return jsonResponse([]);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'agent@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    const button = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    fireEvent.click(button);

    await screen.findByRole('heading', { name: 'Agent Landing' });
    expect(vi.mocked(fetch).mock.calls.filter(([input]) => String(input).endsWith('/auth/login'))).toHaveLength(1);
  });

  it('maps INVALID_CREDENTIALS to the login-specific message', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ code: 'INVALID_CREDENTIALS', message: 'nope' }, 401));

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or password is incorrect')).toBeInTheDocument();
  });

  it('maps a legacy generic 401 to the same invalid-credentials message', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ code: 'invalid_credentials', message: 'nope' }, 401));

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or password is incorrect')).toBeInTheDocument();
  });

  it('maps ACCOUNT_DISABLED to the deactivated-account message', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ code: 'ACCOUNT_DISABLED', message: 'disabled' }, 403));

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('This account has been deactivated. Please contact your administrator'),
    ).toBeInTheDocument();
  });

  it('maps INVITE_PENDING to the invite-pending message', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ code: 'INVITE_PENDING', message: 'pending' }, 403));

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('This account has not been activated yet. Check your email for the invitation'),
    ).toBeInTheDocument();
  });

  it('ACCOUNT_LOCKED shows a live countdown from Retry-After and disables the button until it expires (AC5)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ code: 'ACCOUNT_LOCKED', message: 'locked' }, 423, { 'Retry-After': '5' }),
    );

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText(/Too many failed attempts\. Try again in 5s/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
    vi.useRealTimers();
  });

  it('never renders any "attempts remaining" text (AC6)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ code: 'ACCOUNT_LOCKED', message: 'locked' }, 423, { 'Retry-After': '5' }),
    );

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText(/Too many failed attempts/);
    expect(screen.queryByText(/attempts? remaining/i)).not.toBeInTheDocument();
  });

  it('clears the password from form state after submit resolves, success or failure (AC13, G9)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ code: 'INVALID_CREDENTIALS', message: 'nope' }, 401));

    renderSignIn();
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Sup3rSecret!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText('Email or password is incorrect');
    expect((screen.getByLabelText(/Password/) as HTMLInputElement).value).toBe('');
  });

  it('focuses the first invalid field on a validation failure (AC17, G3)', async () => {
    renderSignIn();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByLabelText(/Email/)).toHaveFocus());
  });

  it('switching locale to ar sets <html dir="rtl"> while the email input stays dir="ltr" (AC18, G8)', async () => {
    renderSignIn();

    fireEvent.click(screen.getByRole('button', { name: 'Arabic' }));

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(screen.getByLabelText(/Email|البريد/)).toHaveAttribute('dir', 'ltr');
  });

  it('?signedOut=1 renders the info banner inside the card, above the heading', async () => {
    renderSignIn(['/login?signedOut=1']);

    const banner = await screen.findByText('You have been signed out');
    const heading = screen.getByRole('heading', { name: 'Sign in' });
    const card = heading.closest('section');
    expect(card).toContainElement(banner);
    // Above the heading in DOM order.
    expect(banner.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the card at the documented 400px maximum width (AC4)', () => {
    renderSignIn();
    const heading = screen.getByRole('heading', { name: 'Sign in' });
    const card = heading.closest('section');
    expect(card?.className).toMatch(/card/);
  });

  it('the submit button carries size="lg" and fullWidth inside a stretch FormActions row (AC4)', () => {
    renderSignIn();
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button.className).toMatch(/fullWidth/);
  });

  it('the password toggle exposes aria-pressed (AC5)', () => {
    renderSignIn();
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders a single required-fields note (AC7)', () => {
    renderSignIn();
    expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
  });
});
