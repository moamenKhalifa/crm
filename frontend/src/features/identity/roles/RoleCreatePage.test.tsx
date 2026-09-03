import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import RoleCreatePage from './RoleCreatePage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Mirrors `UserCreatePage.test.tsx` — nest the same way `RoleRoutes.tsx` does
// (`index` / `new`) so `navigate('..')` resolves the way it does in production.
function renderPage() {
  return render(
    <ToastProvider>
      <ApiClientProvider baseUrl="/api">
        <MemoryRouter initialEntries={['/new']}>
          <Routes>
            <Route index element={<h1>Role list</h1>} />
            <Route path="new" element={<RoleCreatePage />} />
          </Routes>
        </MemoryRouter>
      </ApiClientProvider>
    </ToastProvider>,
  );
}

describe('RoleCreatePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a role and navigates back to the list', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 'r1', name: 'Support Lead', description: null }, 201));

    renderPage();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Support Lead' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create role' }));

    expect(await screen.findByRole('heading', { name: 'Role list' })).toBeInTheDocument();
    expect(
      vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/identity/roles')),
    ).toBe(true);
  });

  it('shows a duplicate-role message on 409', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { code: 'duplicate_role', message: 'exists' } }, 409));

    renderPage();
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'agent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create role' }));

    expect(await screen.findByText('A role with this name already exists.')).toBeInTheDocument();
  });

  it('blocks submit on an empty form', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Create role' }));

    expect(await screen.findAllByText('This field is required.')).not.toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});
