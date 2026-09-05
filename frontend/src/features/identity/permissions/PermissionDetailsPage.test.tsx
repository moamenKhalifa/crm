import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';

import PermissionDetailsPage from './PermissionDetailsPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const PERMISSION = { id: 'p1', code: 'User.View', description: 'View users' };

const TOKENS = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  token_type: 'Bearer' as const,
  access_expires_in: 900,
  refresh_expires_in: 1_209_600,
};

const ME = {
  id: 'admin-1',
  email: 'admin@example.com',
  full_name: 'Admin Example',
  is_active: true,
  is_customer: false,
  roles: [{ id: 'role-1', name: 'admin', description: null }],
};

function renderDetails() {
  return render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthorizationProvider roles={['admin']} permissions={['Permission.View', 'Permission.Delete']}>
            <ApiClientProvider baseUrl="/api">
              <MemoryRouter initialEntries={['/admin/permissions/p1']}>
                <Routes>
                  <Route path="/admin/permissions/:id" element={<PermissionDetailsPage />} />
                  <Route path="/admin/permissions" element={<h1>Permission list</h1>} />
                </Routes>
              </MemoryRouter>
            </ApiClientProvider>
          </AuthorizationProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
}

describe('PermissionDetailsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the permission code and description', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(PERMISSION));
    renderDetails();

    expect(await screen.findByText('User.View')).toBeInTheDocument();
    expect(screen.getByText('View users')).toBeInTheDocument();
  });

  it('deleting a permission that is part of the current admin\'s own set reloads identity and redirects', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    let meCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) {
        meCalls += 1;
        return jsonResponse({ ...ME, permissions: ['User.View'] });
      }
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      if (url.endsWith('/identity/permissions/p1')) return jsonResponse(PERMISSION);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderDetails();
    await screen.findByText('User.View');
    await waitFor(() => expect(meCalls).toBeGreaterThanOrEqual(1));

    const deleteTrigger = screen.getByRole('button', { name: 'Delete' });
    expect(deleteTrigger).toHaveAttribute('data-variant', 'danger-subtle');
    fireEvent.click(deleteTrigger);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveAttribute('data-variant', 'danger');
    fireEvent.click(confirmButton);

    expect(await screen.findByRole('heading', { name: 'Permission list' })).toBeInTheDocument();
    await waitFor(() => expect(meCalls).toBeGreaterThanOrEqual(2));
  });
});
