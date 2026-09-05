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

import PermissionListPage from './PermissionListPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const PERMISSIONS = [
  { id: 'p1', code: 'User.View', description: 'View users' },
  { id: 'p2', code: 'User.Create', description: null },
];

function mockFetchImplementation(permissions: typeof PERMISSIONS) {
  return async () => jsonResponse({ items: permissions, total: permissions.length, limit: 25, offset: 0 });
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
                  <MemoryRouter initialEntries={['/admin/permissions']}>
                    <PermissionListPage />
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

describe('PermissionListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.mocked(fetch).mockImplementation(mockFetchImplementation(PERMISSIONS));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a row for each permission', async () => {
    renderList(['Permission.View']);
    expect(await screen.findByText('User.View')).toBeInTheDocument();
    expect(screen.getByText('User.Create')).toBeInTheDocument();
    expect(screen.getByText('2 permissions')).toBeInTheDocument();
  });

  it('hides the Create button without Permission.Create', async () => {
    renderList(['Permission.View']);
    await screen.findByText('User.View');
    expect(screen.queryByRole('button', { name: 'Create permission' })).not.toBeInTheDocument();
  });

  it('disables row-level Delete (with a reason) without Permission.Delete, rather than hiding it', async () => {
    renderList(['Permission.View']);
    await screen.findByText('User.View');
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete/ });
    expect(deleteButtons.length).toBeGreaterThan(0);
    for (const button of deleteButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('renders row-level Delete with the de-emphasized danger-subtle variant', async () => {
    renderList(['Permission.View', 'Permission.Delete']);
    await screen.findByText('User.View');
    for (const button of screen.getAllByRole('button', { name: /^Delete/ })) {
      expect(button).toHaveAttribute('data-variant', 'danger-subtle');
    }
  });

  it('renders View/Edit as tertiary, sm buttons sharing the same variant/size as their peers', async () => {
    renderList(['Permission.View', 'Permission.Update']);
    await screen.findByText('User.View');

    const viewButtons = screen.getAllByRole('button', { name: /^View/ });
    const editButtons = screen.getAllByRole('button', { name: /^Edit/ });
    expect(viewButtons.length).toBeGreaterThan(0);
    expect(editButtons.length).toBeGreaterThan(0);
    for (const button of [...viewButtons, ...editButtons]) {
      expect(button).toHaveAttribute('data-variant', 'tertiary');
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });

  it('deleting a row calls DELETE and reloads the list', async () => {
    renderList(['Permission.View', 'Permission.Delete']);
    await screen.findByText('User.View');

    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return mockFetchImplementation([PERMISSIONS[1]])();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete — User.View' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true),
    );
    await waitFor(() => expect(screen.queryByText('User.View')).not.toBeInTheDocument());
  });
});
