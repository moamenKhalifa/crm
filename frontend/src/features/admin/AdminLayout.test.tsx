import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AuthorizationProvider } from '@shared/authorization';
import sidebarStyles from '@shared/components/navigation/AppSidebar.module.css';

import { AdminLayout } from './AdminLayout';

function renderLayout(permissions: string[], initialEntries: string[] = ['/admin/users']) {
  return render(
    <AuthorizationProvider roles={['admin']} permissions={permissions}>
      <MemoryRouter initialEntries={initialEntries}>
        <AdminLayout>
          <p>body</p>
        </AdminLayout>
      </MemoryRouter>
    </AuthorizationProvider>,
  );
}

describe('AdminLayout', () => {
  it('shows all sidebar items when every permission is granted', () => {
    renderLayout(['User.View', 'Role.View', 'Permission.View']);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
  });

  it('hides items the user lacks the *.View permission for', () => {
    renderLayout(['User.View']);
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.queryByText('Roles')).not.toBeInTheDocument();
    expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
  });

  it('highlights the active route', () => {
    renderLayout(['User.View', 'Role.View', 'Permission.View'], ['/admin/users']);
    expect(screen.getByText('Users').closest('a')).toHaveClass(sidebarStyles.linkActive);
    expect(screen.getByText('Roles').closest('a')).not.toHaveClass(sidebarStyles.linkActive);
  });
});
