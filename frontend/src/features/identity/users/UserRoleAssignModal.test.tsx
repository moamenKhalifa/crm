import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import { UserRoleAssignModal } from './UserRoleAssignModal';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const TOKENS = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  token_type: 'Bearer' as const,
  access_expires_in: 900,
  refresh_expires_in: 1_209_600,
};

const ROLES = [
  { id: 'r1', name: 'agent', description: null },
  { id: 'r2', name: 'admin', description: null },
];

const TARGET_USER = {
  id: 'u1',
  email: 'alice@example.com',
  full_name: 'Alice',
  is_active: true,
  is_customer: false,
  roles: [{ id: 'r1', name: 'agent', description: null }],
};

function renderModal(currentUserId: string | null) {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <ApiClientProvider baseUrl="/api">
            <UserRoleAssignModal open user={TARGET_USER} onClose={onClose} onSaved={onSaved} />
          </ApiClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
  return { ...utils, onSaved, onClose, currentUserId };
}

describe('UserRoleAssignModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preselects the user\'s current roles and saves the sorted selection via PUT', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/identity/roles?limit=100&offset=0')) return jsonResponse(ROLES);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const { onSaved } = renderModal(null);

    const agentCheckbox = await screen.findByLabelText('agent');
    const adminCheckbox = screen.getByLabelText('admin');
    expect(agentCheckbox).toBeChecked();
    expect(adminCheckbox).not.toBeChecked();

    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (init?.method === 'PUT') return jsonResponse({ ...TARGET_USER, roles: ROLES });
      throw new Error(`unexpected fetch: ${url}`);
    });

    fireEvent.click(adminCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const putCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PUT');
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual({ role_ids: ['r1', 'r2'] });
  });

  it('reloads the auth context when the edited user is the current admin', async () => {
    window.localStorage.setItem('crm.rt', 'stored-refresh-token');
    let meCalls = 0;
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return jsonResponse(TOKENS);
      if (url.endsWith('/auth/me')) {
        meCalls += 1;
        return jsonResponse(TARGET_USER);
      }
      if (url.endsWith('/identity/roles?limit=100&offset=0')) return jsonResponse(ROLES);
      if (url.includes('/roles/') && !url.includes('limit=100')) return jsonResponse([]);
      if (init?.method === 'PUT') return jsonResponse(TARGET_USER);
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderModal(TARGET_USER.id);

    await screen.findByLabelText('agent');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(meCalls).toBeGreaterThanOrEqual(2));
  });
});
