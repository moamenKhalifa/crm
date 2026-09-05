import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ApiClientProvider } from '@shared/api';
import { AuthorizationProvider } from '@shared/authorization';
import { ToastProvider } from '@shared/components';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';
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

const ROLES_FOR_PICKER = [{ id: 'r1', name: 'admin', description: null }];

/** Routes the mocked `fetch` by URL — `/identity/users` gets the `paged=true` envelope, `/identity/roles` (the filter-option picker fetch) gets the legacy flat array. */
function mockFetchImplementation(users: typeof USERS) {
  return async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/identity/roles')) {
      return jsonResponse(ROLES_FOR_PICKER);
    }
    return jsonResponse({ items: users, total: users.length, limit: 25, offset: 0 });
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
                  <MemoryRouter initialEntries={['/admin/users']}>
                    <UserListPage />
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

describe('UserListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.mocked(fetch).mockImplementation(mockFetchImplementation(USERS));
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

  it('renders role badges as neutral chips (metadata, not a semantic state — AC8)', async () => {
    renderList(['User.View']);
    const badge = await screen.findByText('admin');
    expect(badge).toHaveAttribute('data-variant', 'neutral');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
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

  it('disables row-level Delete (with a reason) without User.Delete, rather than hiding it', async () => {
    renderList(['User.View']);
    await screen.findByText('Alice');
    const deleteButtons = screen.getAllByRole('button', { name: /^Delete/ });
    expect(deleteButtons.length).toBeGreaterThan(0);
    for (const button of deleteButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('renders row-level Delete with the de-emphasized danger-subtle variant', async () => {
    renderList(['User.View', 'User.Delete']);
    await screen.findByText('Alice');
    for (const button of screen.getAllByRole('button', { name: /^Delete/ })) {
      expect(button).toHaveAttribute('data-variant', 'danger-subtle');
    }
  });

  it('renders View/Edit as tertiary, sm buttons sharing the same variant/size as their peers', async () => {
    renderList(['User.View', 'User.Update']);
    await screen.findByText('Alice');

    const viewButtons = screen.getAllByRole('button', { name: /^View/ });
    const editButtons = screen.getAllByRole('button', { name: /^Edit/ });
    expect(viewButtons.length).toBeGreaterThan(0);
    expect(editButtons.length).toBeGreaterThan(0);
    for (const button of [...viewButtons, ...editButtons]) {
      expect(button).toHaveAttribute('data-variant', 'tertiary');
      expect(button).toHaveAttribute('data-size', 'sm');
    }
  });

  it('each row action button accessible name includes the row label', async () => {
    renderList(['User.View', 'User.Update', 'User.Delete']);
    await screen.findByText('Alice');
    expect(screen.getByRole('button', { name: 'View — Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit — Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete — Alice' })).toBeInTheDocument();
  });

  it('deleting a row calls DELETE and reloads the list', async () => {
    renderList(['User.View', 'User.Delete']);
    await screen.findByText('Alice');

    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return mockFetchImplementation([USERS[1]])(input);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete — Alice' }));

    // Deleting a user is destructive — Confirm stays disabled until the
    // user's email is typed exactly (AC5).
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Type “a@example.com” to confirm'), {
      target: { value: 'a@example.com' },
    });
    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true),
    );
    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument());
  });

  it('still renders the user list, without the Role filter or a global Forbidden toast, when the role-picker lookup 403s (viewer has User.View but not Role.View)', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/identity/roles')) {
        return jsonResponse(
          { error: { code: 'insufficient_permissions', message: 'Missing required permission: Role.View' } },
          403,
        );
      }
      return jsonResponse({ items: USERS, total: USERS.length, limit: 25, offset: 0 });
    });

    renderList(['User.View']);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Status filter (a single-select <Select>) still present; Role filter
    // (multi-select, rendered as a button) silently omitted rather than
    // shown empty or erroring — filtering by role is a convenience on top
    // of a page a `User.View`-only viewer is fully entitled to use.
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Role' })).not.toBeInTheDocument();
    expect(screen.queryByText("You don't have permission to do that.")).not.toBeInTheDocument();
  });

  it('shows FilteredEmpty (not the plain EmptyState) when a search yields zero rows', async () => {
    renderList(['User.View']);
    await screen.findByText('Alice');

    vi.mocked(fetch).mockImplementation(mockFetchImplementation([]));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-no-match' } });

    expect(await screen.findByText('No users match these filters', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
    expect(screen.queryByText('No users yet')).not.toBeInTheDocument();
  });
});
