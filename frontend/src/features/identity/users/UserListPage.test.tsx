import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';
import { ConfigProvider } from '@app/configuration/ConfigProvider';

import UserListPage from './UserListPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const USERS = [
  {
    id: 'u1',
    email: 'a@example.com',
    full_name: 'Alice',
    is_active: true,
    is_customer: false,
    roles: [{ id: 'r1', name: 'admin' }],
  },
  { id: 'u2', email: 'b@example.com', full_name: 'Bob', is_active: false, is_customer: false, roles: [] },
];

function renderList(permissions: string[]) {
  return render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthorizationProvider roles={['admin']} permissions={permissions}>
            <ApiClientProvider baseUrl="/api">
              <MemoryRouter initialEntries={['/admin/users']}>
                <UserListPage />
              </MemoryRouter>
            </ApiClientProvider>
          </AuthorizationProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
}

describe('UserListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.mocked(fetch).mockResolvedValue(jsonResponse(USERS));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders rows for each user', async () => {
    renderList(['User.View']);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('2 users')).toBeInTheDocument();
  });

  it('renders role badges with the info variant', async () => {
    renderList(['User.View']);
    expect(await screen.findByText('admin')).toHaveAttribute('data-variant', 'info');
  });

  it('hides the Create button without User.Create', async () => {
    renderList(['User.View']);
    await screen.findByText('Alice');
    expect(screen.queryByRole('button', { name: 'Create user' })).not.toBeInTheDocument();
  });

  it('shows the Create button with User.Create', async () => {
    renderList(['User.View', 'User.Create']);
    await screen.findByText('Alice');
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument();
  });

  it('hides Delete actions without User.Delete', async () => {
    renderList(['User.View']);
    await screen.findByText('Alice');
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('renders row-level Delete with the de-emphasized danger-subtle variant', async () => {
    renderList(['User.View', 'User.Delete']);
    await screen.findByText('Alice');
    for (const button of screen.getAllByRole('button', { name: 'Delete' })) {
      expect(button).toHaveAttribute('data-variant', 'danger-subtle');
    }
  });

  it('renders View/Edit as tertiary, sm buttons sharing the same variant/size as their peers', async () => {
    renderList(['User.View', 'User.Update']);
    await screen.findByText('Alice');

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
    renderList(['User.View', 'User.Delete']);
    await screen.findByText('Alice');

    vi.mocked(fetch).mockClear();
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return jsonResponse([USERS[1]]);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true),
    );
    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument());
  });
});
