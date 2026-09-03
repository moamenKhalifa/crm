import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientProvider } from '@shared/api';
import { ToastProvider } from '@shared/components';

import PermissionCreatePage from './PermissionCreatePage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

// Mirrors `RoleCreatePage.test.tsx` — same `index` / `new` nesting as
// `PermissionRoutes.tsx` so `navigate('..')` resolves correctly.
function renderPage() {
  return render(
    <ToastProvider>
      <ApiClientProvider baseUrl="/api">
        <MemoryRouter initialEntries={['/new']}>
          <Routes>
            <Route index element={<h1>Permission list</h1>} />
            <Route path="new" element={<PermissionCreatePage />} />
          </Routes>
        </MemoryRouter>
      </ApiClientProvider>
    </ToastProvider>,
  );
}

describe('PermissionCreatePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a permission and navigates back to the list', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 'p1', code: 'User.View', description: null }, 201));

    renderPage();
    fireEvent.change(screen.getByLabelText(/^Code/), { target: { value: 'User.View' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(await screen.findByRole('heading', { name: 'Permission list' })).toBeInTheDocument();
  });

  it('rejects a code that does not match the Section.Action format', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/^Code/), { target: { value: 'not valid!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(await screen.findByText('Use Section.Action format, e.g. User.View.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows a duplicate-permission message on 409', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'duplicate_permission', message: 'exists' } }, 409),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText(/^Code/), { target: { value: 'User.View' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create permission' }));

    expect(await screen.findByText('A permission with this code already exists.')).toBeInTheDocument();
  });
});
