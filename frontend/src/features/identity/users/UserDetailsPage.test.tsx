import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';

import UserDetailsPage from './UserDetailsPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const USER = {
  id: 'u1',
  email: 'alice@example.com',
  full_name: 'Alice',
  is_active: true,
  is_customer: false,
  roles: [{ id: 'r1', name: 'agent', description: null }],
  permissions: [] as string[],
};

function renderDetails(permissions: string[]) {
  return render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthorizationProvider roles={['admin']} permissions={permissions}>
            <ApiClientProvider baseUrl="/api">
              <MemoryRouter initialEntries={['/admin/users/u1']}>
                <Routes>
                  <Route path="/admin/users/:id" element={<UserDetailsPage />} />
                </Routes>
              </MemoryRouter>
            </ApiClientProvider>
          </AuthorizationProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
}

describe('UserDetailsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the user profile and role badges', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(USER));
    renderDetails(['User.View']);

    expect(await screen.findByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
  });

  it('the activation toggle triggers a PATCH and updates the label', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (init?.method === 'PATCH' && url.endsWith('/active')) return jsonResponse({ ...USER, is_active: false });
      return jsonResponse(USER);
    });

    renderDetails(['User.View', 'User.Update']);
    await screen.findByRole('heading', { name: 'Alice' });

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([u, i]) => String(u).endsWith('/active') && i?.method === 'PATCH')).toBe(
        true,
      ),
    );
    expect(await screen.findByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('confirming delete triggers DELETE and navigates back to the list', async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return jsonResponse(USER);
    });

    render(
      <ConfigProvider>
        <ToastProvider>
          <AuthProvider>
            <AuthorizationProvider roles={['admin']} permissions={['User.View', 'User.Delete']}>
              <ApiClientProvider baseUrl="/api">
                <MemoryRouter initialEntries={['/admin/users/u1']}>
                  <Routes>
                    <Route path="/admin/users/:id" element={<UserDetailsPage />} />
                    <Route path="/admin/users" element={<h1>User list</h1>} />
                  </Routes>
                </MemoryRouter>
              </ApiClientProvider>
            </AuthorizationProvider>
          </AuthProvider>
        </ToastProvider>
      </ConfigProvider>,
    );

    await screen.findByRole('heading', { name: 'Alice' });
    const deleteTrigger = screen.getByRole('button', { name: 'Delete' });
    expect(deleteTrigger).toHaveAttribute('data-variant', 'danger-subtle');
    fireEvent.click(deleteTrigger);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveAttribute('data-variant', 'danger');

    // Deleting a user is destructive — Confirm stays disabled until the
    // user's email is typed exactly (AC5).
    expect(confirmButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Type “alice@example.com” to confirm'), {
      target: { value: 'alice@example.com' },
    });
    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    expect(await screen.findByRole('heading', { name: 'User list' })).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
  });

  it('disables the delete trigger with a reason when the viewed user is the current admin', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    const TOKENS = {
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      token_type: 'Bearer' as const,
      access_expires_in: 900,
      refresh_expires_in: 1_209_600,
    };
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) return jsonResponse(USER);
      return jsonResponse(USER);
    });

    renderDetails(['User.View', 'User.Delete']);
    await screen.findByRole('heading', { name: 'Alice' });

    // Accessible name includes the sr-only reason text (rendered so
    // `aria-describedby` has something to point at) — match by prefix.
    const deleteTrigger = await screen.findByRole('button', { name: /^Delete/ });
    await waitFor(() => expect(deleteTrigger).toBeDisabled());
    expect(deleteTrigger).toHaveAttribute('data-variant', 'danger-subtle');

    const describedById = deleteTrigger.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById!)).toHaveTextContent('You cannot delete your own account');
    expect(deleteTrigger).toHaveAttribute('title', 'You cannot delete your own account');
  });
});
