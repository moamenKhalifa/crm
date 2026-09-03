import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import UserEditPage from './UserEditPage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const USER = { id: 'u1', email: 'alice@example.com', full_name: 'Alice', is_active: true, is_customer: false, roles: [] };

function renderPage() {
  return render(
    <ToastProvider>
      <ApiClientProvider baseUrl="/api">
        <MemoryRouter initialEntries={['/admin/users/u1/edit']}>
          <Routes>
            <Route path="/admin/users/:id/edit" element={<UserEditPage />} />
            <Route path="/admin/users/:id" element={<h1>User details</h1>} />
          </Routes>
        </MemoryRouter>
      </ApiClientProvider>
    </ToastProvider>,
  );
}

describe('UserEditPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits only the changed field', async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === 'PATCH') return jsonResponse({ ...USER, full_name: 'Alice Updated' });
      return jsonResponse(USER);
    });

    renderPage();
    await screen.findByDisplayValue('Alice');

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Alice Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'User details' })).toBeInTheDocument());

    const patchCall = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({ full_name: 'Alice Updated' });
  });
});
