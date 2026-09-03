import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';

import RoleDetailsPage from './RoleDetailsPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ROLE = { id: 'r1', name: 'agent', description: 'Front-line support' };
const PERMISSIONS = [{ id: 'p1', code: 'User.View', description: null }];

function renderDetails(permissions: string[]) {
  return render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthorizationProvider roles={['admin']} permissions={permissions}>
            <ApiClientProvider baseUrl="/api">
              <MemoryRouter initialEntries={['/admin/roles/r1']}>
                <Routes>
                  <Route path="/admin/roles/:id" element={<RoleDetailsPage />} />
                  <Route path="/admin/roles" element={<h1>Role list</h1>} />
                </Routes>
              </MemoryRouter>
            </ApiClientProvider>
          </AuthorizationProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
}

describe('RoleDetailsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the role and its permission chips', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/permissions')) return jsonResponse(PERMISSIONS);
      return jsonResponse(ROLE);
    });

    renderDetails(['Role.View']);
    expect(await screen.findByRole('heading', { name: 'agent' })).toBeInTheDocument();
    expect(screen.getByText('User.View')).toBeInTheDocument();
  });

  it('removing a permission chip calls DELETE and the chip disappears', async () => {
    let removed = false;
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (init?.method === 'DELETE') {
        removed = true;
        return jsonResponse(ROLE);
      }
      if (url.endsWith('/permissions')) return jsonResponse(removed ? [] : PERMISSIONS);
      return jsonResponse(ROLE);
    });

    renderDetails(['Role.View', 'Role.AssignPermission']);
    await screen.findByText('User.View');

    fireEvent.click(screen.getByRole('button', { name: 'Remove User.View' }));

    await waitFor(() => expect(screen.queryByText('User.View')).not.toBeInTheDocument());
  });

  it('confirming delete triggers DELETE on the role and navigates back to the list', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/permissions')) return jsonResponse(PERMISSIONS);
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return jsonResponse(ROLE);
    });

    renderDetails(['Role.View', 'Role.Delete']);
    await screen.findByRole('heading', { name: 'agent' });

    const deleteTrigger = screen.getByRole('button', { name: 'Delete' });
    expect(deleteTrigger).toHaveAttribute('data-variant', 'danger-subtle');
    fireEvent.click(deleteTrigger);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveAttribute('data-variant', 'danger');
    fireEvent.click(confirmButton);

    expect(await screen.findByRole('heading', { name: 'Role list' })).toBeInTheDocument();
  });
});
