import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import { RolePermissionAssignModal } from './RolePermissionAssignModal';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ROLE = { id: 'r1', name: 'agent', description: null };

const ALL_PERMISSIONS = [
  { id: 'p1', code: 'User.View', description: null },
  { id: 'p2', code: 'Role.View', description: null },
];

const CURRENT_PERMISSIONS = [{ id: 'p1', code: 'User.View', description: null }];

function renderModal() {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <ApiClientProvider baseUrl="/api">
            <RolePermissionAssignModal
              open
              onClose={onClose}
              role={ROLE}
              currentPermissions={CURRENT_PERMISSIONS}
              onSaved={onSaved}
            />
          </ApiClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
  return { onSaved, onClose };
}

describe('RolePermissionAssignModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preselects current permissions and, on save, only calls the endpoints needed for the actual delta', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/identity/permissions?limit=100&offset=0')) return jsonResponse(ALL_PERMISSIONS);
      if (init?.method === 'PUT') return jsonResponse(ROLE);
      if (init?.method === 'DELETE') return jsonResponse(ROLE);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const { onSaved } = renderModal();

    const userViewCheckbox = await screen.findByLabelText('User.View');
    const roleViewCheckbox = screen.getByLabelText('Role.View');
    expect(userViewCheckbox).toBeChecked();
    expect(roleViewCheckbox).not.toBeChecked();

    // Swap the selection: uncheck the existing one, check the new one.
    fireEvent.click(userViewCheckbox);
    fireEvent.click(roleViewCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    const putCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PUT');
    const deleteCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'DELETE');
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual({ permission_ids: ['p2'] });
    expect(JSON.parse(String(deleteCall?.[1]?.body))).toEqual({ permission_ids: ['p1'] });
  });

  it('does not call PUT or DELETE when the selection is unchanged', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/identity/permissions?limit=100&offset=0')) return jsonResponse(ALL_PERMISSIONS);
      throw new Error(`unexpected fetch: ${url}`);
    });

    const { onClose } = renderModal();
    await screen.findByLabelText('User.View');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'PUT' || init?.method === 'DELETE')).toBe(
      false,
    );
  });
});
