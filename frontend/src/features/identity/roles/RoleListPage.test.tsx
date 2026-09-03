import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';

import RoleListPage from './RoleListPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ROLES = [
  { id: 'r1', name: 'agent', description: 'Front-line support' },
  { id: 'r2', name: 'admin', description: null },
];

function renderList(permissions: string[]) {
  return render(
    <ConfigProvider>
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
    </ConfigProvider>,
  );
}

describe('RoleListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.mocked(fetch).mockResolvedValue(jsonResponse(ROLES));
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

  it('hides Delete actions without Role.Delete', async () => {
    renderList(['Role.View']);
    await screen.findByText('agent');
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('renders row-level Delete with the de-emphasized danger-subtle variant', async () => {
    renderList(['Role.View', 'Role.Delete']);
    await screen.findByText('agent');
    for (const button of screen.getAllByRole('button', { name: 'Delete' })) {
      expect(button).toHaveAttribute('data-variant', 'danger-subtle');
    }
  });

  it('renders View/Edit as tertiary, sm buttons sharing the same variant/size as their peers', async () => {
    renderList(['Role.View', 'Role.Update']);
    await screen.findByText('agent');

    const viewButtons = screen.getAllByRole('button', { name: 'View' });
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    expect(viewButtons.length).toBeGreaterThan(0);
    expect(editButtons.length).toBeGreaterThan(0);
    for (const button of [...viewButtons, ...editButtons]) {
      expect(button).toHaveAttribute('data-variant', 'tertiary');
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });

  it('deleting a row calls DELETE and reloads the list', async () => {
    renderList(['Role.View', 'Role.Delete']);
    await screen.findByText('agent');

    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return jsonResponse([ROLES[1]]);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true),
    );
    await waitFor(() => expect(screen.queryByText('agent')).not.toBeInTheDocument());
  });
});
