import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthorizationProvider } from '@shared/authorization';
import { LocaleProvider } from '@shared/i18n';
import { ThemeProvider } from '@shared/theme';

import type { AppSidebarGroup } from '../navigation/AppSidebar';
import { AuthenticatedLayout } from './AuthenticatedLayout';

const groups: AppSidebarGroup[] = [
  {
    key: 'administration',
    label: 'Administration',
    items: [{ key: 'users', label: 'Users', icon: <span>👤</span>, to: '/admin/users', permission: 'User.View' }],
  },
];

function Page({ title }: { title: string }) {
  return (
    <h1 id="page-heading" tabIndex={-1}>
      {title}
    </h1>
  );
}

function renderLayout(initialEntries: string[] = ['/admin/users'], pageTitle?: string) {
  return render(
    <LocaleProvider>
      <ThemeProvider>
        <AuthorizationProvider roles={['admin']} permissions={['User.View']}>
          <MemoryRouter initialEntries={initialEntries}>
            <AuthenticatedLayout
              displayName="Jane Doe"
              email="jane@example.com"
              signOutLabel="Sign out"
              onSignOut={vi.fn()}
              groups={groups}
              pageTitle={pageTitle}
            >
              <Routes>
                <Route path="/admin/users" element={<Page title="Users" />} />
                <Route path="/admin/roles" element={<Page title="Roles" />} />
              </Routes>
            </AuthenticatedLayout>
          </MemoryRouter>
        </AuthorizationProvider>
      </ThemeProvider>
    </LocaleProvider>,
  );
}

describe('AuthenticatedLayout', () => {
  it('the skip link is the first focusable element and moves focus to #main on activation (AC12)', () => {
    const { container } = renderLayout();

    const focusable = container.querySelectorAll<HTMLElement>('a, button');
    expect(focusable[0]).toHaveTextContent('Skip to content');

    fireEvent.click(focusable[0]);
    expect(document.getElementById('main')).toHaveFocus();
  });

  it('renders exactly one banner, navigation, main and contentinfo landmark (AC13)', () => {
    renderLayout();

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('sets document.title from the pageTitle prop (AC13)', () => {
    renderLayout(['/admin/users'], 'Users');
    expect(document.title).toBe('Users – Customer Support CRM');
  });

  it('falls back to just the app name when pageTitle is unset', () => {
    renderLayout(['/admin/users']);
    expect(document.title).toBe('Customer Support CRM');
  });

  it('on route change, focuses #page-heading and announces via the polite live region (AC14)', async () => {
    renderLayout(['/admin/users'], 'Users');
    await waitFor(() => expect(screen.getByText('Users', { selector: 'h1' })).toHaveFocus());

    // The header's `LanguageSwitcher` renders its own independent
    // `role="status"` live region too — find the one carrying the route title.
    const liveRegions = screen.getAllByRole('status');
    expect(liveRegions.some((region) => region.textContent === 'Users')).toBe(true);
  });

  it('has no automated axe violations on the composed shell (G5, G11)', async () => {
    const { container } = renderLayout(['/admin/users'], 'Users');
    expect(await axe(container)).toHaveNoViolations();
  }, 20_000);
});
