import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AuthorizationProvider } from './AuthorizationProvider';
import { RequireAuth, type AuthStatus, type RequireAuthProps } from './RequireAuth';

function renderAt(
  status: AuthStatus,
  authProps: Partial<Omit<RequireAuthProps, 'status' | 'children'>> = {},
  roles: string[] = [],
  permissions: string[] = [],
) {
  return render(
    <AuthorizationProvider roles={roles} permissions={permissions}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/sign-in" element={<h1>Sign in</h1>} />
          <Route path="/" element={<h1>Home</h1>} />
          <Route
            path="/protected"
            element={
              <RequireAuth status={status} {...authProps}>
                <h1>Protected</h1>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthorizationProvider>,
  );
}

describe('RequireAuth', () => {
  it('renders AppLoading while status is unknown', () => {
    renderAt('unknown');
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('redirects to /sign-in when unauthenticated', () => {
    renderAt('anonymous');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('redirects to / when missing the required role', () => {
    renderAt('authenticated', { role: 'admin' }, ['agent'], []);
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders children when role and permission checks pass', () => {
    renderAt('authenticated', { role: 'admin', permission: 'User.View' }, ['admin'], ['User.View']);
    expect(screen.getByRole('heading', { name: 'Protected' })).toBeInTheDocument();
  });

  it('passes anyPermission/allPermissions checks', () => {
    renderAt(
      'authenticated',
      { anyPermission: ['User.View', 'User.Create'], allPermissions: ['User.View'] },
      [],
      ['User.View'],
    );
    expect(screen.getByRole('heading', { name: 'Protected' })).toBeInTheDocument();
  });
});
