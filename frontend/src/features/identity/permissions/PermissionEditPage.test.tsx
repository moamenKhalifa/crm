import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import PermissionEditPage from './PermissionEditPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const PERMISSION = { id: 'p1', code: 'User.View', description: 'View users' };

function renderPage() {
  return render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <ApiClientProvider baseUrl="/api">
            <MemoryRouter initialEntries={['/admin/permissions/p1/edit']}>
              <Routes>
                <Route path="/admin/permissions/:id/edit" element={<PermissionEditPage />} />
                <Route path="/admin/permissions/:id" element={<h1>Permission details</h1>} />
              </Routes>
            </MemoryRouter>
          </ApiClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
}

describe('PermissionEditPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits only the changed field', async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'PATCH') return jsonResponse({ ...PERMISSION, description: 'Updated' });
      return jsonResponse(PERMISSION);
    });

    renderPage();
    await screen.findByDisplayValue('User.View');

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Permission details' })).toBeInTheDocument());

    const patchCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ description: 'Updated' });
  });
});
