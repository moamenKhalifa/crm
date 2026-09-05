import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import RoleListPage from './RoleListPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ROLES = [
  { id: 'r1', name: 'agent', description: 'Front-line support' },
  { id: 'r2', name: 'admin', description: null },
];

const PERMISSIONS_FOR_PICKER = [{ id: 'p1', code: 'User.View', description: null }];

/** Routes the mocked `fetch` by URL — `/identity/roles` gets the `paged=true` envelope, `/identity/permissions` (the filter-option picker fetch) gets the legacy flat array. */
function mockFetchImplementation(roles: typeof ROLES) {
  return async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/identity/permissions')) {
      return jsonResponse(PERMISSIONS_FOR_PICKER);
    }
    return jsonResponse({ items: roles, total: roles.length, limit: 25, offset: 0 });
  };
}

function renderList(permissions: string[]) {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider branding={defaultBranding}>
          <ToastProvider>
            <AuthProvider>
              <AuthorizationProvider roles={['admin']} permissions={permissions}>
                <ApiClientProvider baseUrl="/api">
                  <MemoryRouter initialEntries={['/admin/roles']}>
                    <RoleListPage />
                  </MemoryRouter>
                </ApiClientProvider>
              </AuthorizationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('RoleListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.mocked(fetch).mockImplementation(mockFetchImplementation(ROLES));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a row for each role', async () => {
    renderList(['Role.View']);
    expect(await screen.findByText('agent')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('2 roles')).toBeInTheDocument();
  });

  it('hides the Create button without Role.Create', async () => {
    renderList(['Role.View']);
    await screen.findByText('agent');
    expect(screen.queryByRole('button', { name: 'Create role' })).not.toBeInTheDocument();
  });

  it('disables row-level Delete (with a reason) without Role.Delete, rather than hiding it', async () => {
    renderList(['Role.View']);
    await screen.findByText('agent');
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete/ });
    expect(deleteButtons.length).toBeGreaterThan(0);
    for (const button of deleteButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('renders row-level Delete with the de-emphasized danger-subtle variant', async () => {
    renderList(['Role.View', 'Role.Delete']);
    await screen.findByText('agent');
    for (const button of screen.getAllByRole('button', { name: /^Delete/ })) {
      expect(button).toHaveAttribute('data-variant', 'danger-subtle');
    }
  });

  it('renders View/Edit as tertiary, sm buttons sharing the same variant/size as their peers', async () => {
    renderList(['Role.View', 'Role.Update']);
    await screen.findByText('agent');

    const viewButtons = screen.getAllByRole('button', { name: /^View/ });
    const editButtons = screen.getAllByRole('button', { name: /^Edit/ });
    expect(viewButtons.length).toBeGreaterThan(0);
    expect(editButtons.length).toBeGreaterThan(0);
    for (const button of [...viewButtons, ...editButtons]) {
      expect(button).toHaveAttribute('data-variant', 'tertiary');
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });

  it('renders the Permission filter when the permission-picker lookup succeeds', async () => {
    renderList(['Role.View']);
    await screen.findByText('agent');
    expect(screen.getByRole('button', { name: 'Permission' })).toBeInTheDocument();
  });

  it('still renders the role list, without the Permission filter or a global Forbidden toast, when the permission-picker lookup 403s (viewer has Role.View but not Permission.View)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/identity/permissions')) {
        return jsonResponse(
          { error: { code: 'insufficient_permissions', message: 'Missing required permission: Permission.View' } },
          403,
        );
      }
      return jsonResponse({ items: ROLES, total: ROLES.length, limit: 25, offset: 0 });
    });

    renderList(['Role.View']);

    expect(await screen.findByText('agent')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Permission' })).not.toBeInTheDocument();
    expect(screen.queryByText("You don't have permission to do that.")).not.toBeInTheDocument();
  });

  it('deleting a row calls DELETE and reloads the list', async () => {
    renderList(['Role.View', 'Role.Delete']);
    await screen.findByText('agent');

    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return mockFetchImplementation([ROLES[1]])(input);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete — agent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true),
    );
    await waitFor(() => expect(screen.queryByText('agent')).not.toBeInTheDocument());
  });
});
