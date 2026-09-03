import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@features/authentication/AuthProvider';
import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import RoleEditPage from './RoleEditPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const ROLE = { id: 'r1', name: 'agent', description: 'Front-line support' };

function renderPage() {
  return render(
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <ApiClientProvider baseUrl="/api">
            <MemoryRouter initialEntries={['/admin/roles/r1/edit']}>
              <Routes>
                <Route path="/admin/roles/:id/edit" element={<RoleEditPage />} />
                <Route path="/admin/roles/:id" element={<h1>Role details</h1>} />
              </Routes>
            </MemoryRouter>
          </ApiClientProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>,
  );
}

describe('RoleEditPage', () => {
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
      if (init?.method === 'PATCH') return jsonResponse({ ...ROLE, name: 'senior-agent' });
      return jsonResponse(ROLE);
    });

    renderPage();
    await screen.findByDisplayValue('agent');

    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'senior-agent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Role details' })).toBeInTheDocument());

    const patchCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ name: 'senior-agent' });
  });
});
