import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import UserCreatePage from './UserCreatePage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Mirrors `UserRoutes.tsx`'s own relative route shape (`index` / `new`) —
// `navigate('..')` inside `UserCreatePage` resolves relative to the nearest
// matched route pattern, so the test route tree must nest the same way
// production does, not just live at the same absolute URL.
function renderPage() {
  return render(
    <ToastProvider>
      <ApiClientProvider baseUrl="/api">
        <MemoryRouter initialEntries={['/new']}>
          <Routes>
            <Route index element={<h1>User list</h1>} />
            <Route path="new" element={<UserCreatePage />} />
          </Routes>
        </MemoryRouter>
      </ApiClientProvider>
    </ToastProvider>,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'New User' } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'Passw0rd!' } });
}

describe('UserCreatePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a user, toasts, navigates, and clears the password field', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/identity/roles?limit=100&offset=0')) return jsonResponse([]);
      if (url.endsWith('/identity/users')) {
        return jsonResponse({ id: 'u1', email: 'new@example.com', full_name: 'New User', is_active: true, is_customer: false, roles: [] }, 201);
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByRole('heading', { name: 'User list' })).toBeInTheDocument();
    expect(
      vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/identity/users')),
    ).toBe(true);
  });

  it('shows a duplicate-account message on 409', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/identity/roles?limit=100&offset=0')) return jsonResponse([]);
      return jsonResponse({ error: { code: 'duplicate_account', message: 'exists' } }, 409);
    });

    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
  });

  it('blocks submit on an empty form', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findAllByText('This field is required.')).not.toHaveLength(0);
    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/identity/users'))).toBe(
        false,
      ),
    );
  });
});
