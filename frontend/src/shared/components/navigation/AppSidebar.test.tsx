import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AuthorizationProvider } from '@shared/authorization';

import { AppSidebar, type AppSidebarItem } from './AppSidebar';

const items: AppSidebarItem[] = [
  { key: 'tickets', label: 'Tickets', to: '/agent/tickets', permission: 'Ticket.View' },
  { key: 'admin-users', label: 'Users', to: '/admin/users', role: 'admin' },
  { key: 'home', label: 'Home', to: '/agent' },
];

function renderSidebar(roles: string[], permissions: string[]) {
  return render(
    <AuthorizationProvider roles={roles} permissions={permissions}>
      <MemoryRouter>
        <AppSidebar items={items} />
      </MemoryRouter>
    </AuthorizationProvider>,
  );
}

describe('AppSidebar', () => {
  it('filters items via useAuthorization()', () => {
    renderSidebar(['agent'], []);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Tickets')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('shows permission-gated and role-gated items once authorized', () => {
    renderSidebar(['admin'], ['Ticket.View']);

    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
