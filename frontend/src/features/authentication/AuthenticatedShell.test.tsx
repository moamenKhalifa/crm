import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { AuthorizationProvider } from '@shared/authorization';
import { LocaleProvider } from '@shared/i18n';
import { ThemeProvider } from '@shared/theme';

import { AuthenticatedShell } from './AuthenticatedShell';
import { AuthProvider } from './AuthProvider';

function renderShell(permissions: string[]) {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider>
          <AuthProvider>
            <AuthorizationProvider roles={['admin']} permissions={permissions}>
              <MemoryRouter initialEntries={['/admin/users']}>
                <AuthenticatedShell>
                  <h1 id="page-heading" tabIndex={-1}>
                    Users
                  </h1>
                </AuthenticatedShell>
              </MemoryRouter>
            </AuthorizationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('AuthenticatedShell', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders all three admin sidebar items when every permission is granted (AC2)', () => {
    renderShell(['User.View', 'Role.View', 'Permission.View']);
    expect(screen.getByRole('link', { name: /Users/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Roles/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Permissions/ })).toBeInTheDocument();
  });

  it('renders only the Users item when only User.View is granted (AC2)', () => {
    renderShell(['User.View']);
    expect(screen.getByRole('link', { name: /Users/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Roles/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Permissions/ })).not.toBeInTheDocument();
  });

  it('the LanguageSwitcher is present in the header (AC8)', () => {
    renderShell(['User.View']);
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'العربية' })).toBeInTheDocument();
  });
});
