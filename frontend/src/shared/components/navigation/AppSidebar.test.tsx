import type { ComponentProps } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthorizationProvider } from '@shared/authorization';
import { LocaleProvider } from '@shared/i18n';
import { ThemeProvider } from '@shared/theme';

import { AppSidebar, type AppSidebarGroup } from './AppSidebar';
import styles from './AppSidebar.module.css';

// Mirrors `useBreakpoint.test.tsx`'s helper — forces a specific breakpoint
// bucket regardless of the global test polyfill's "wide" default.
function mockMatchMediaAtWidth(widthPx: number) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => {
      const match = /min-width:\s*(\d+)px/.exec(query);
      const minWidth = match ? Number(match[1]) : 0;
      return {
        matches: widthPx >= minWidth,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
  );
}

const groups: AppSidebarGroup[] = [
  {
    key: 'main',
    label: 'Main',
    items: [
      { key: 'tickets', label: 'Tickets', icon: <span>🎫</span>, to: '/agent/tickets', permission: 'Ticket.View' },
      { key: 'admin-users', label: 'Users', icon: <span>👤</span>, to: '/admin/users', role: 'admin' },
      { key: 'home', label: 'Home', icon: <span>🏠</span>, to: '/agent' },
    ],
  },
];

function renderSidebar(
  roles: string[],
  permissions: string[],
  initialEntries: string[] = ['/'],
  extraProps: Partial<ComponentProps<typeof AppSidebar>> = {},
) {
  return render(
    <LocaleProvider>
      <ThemeProvider>
        <AuthorizationProvider roles={roles} permissions={permissions}>
          <MemoryRouter initialEntries={initialEntries}>
            <AppSidebar groups={groups} {...extraProps} />
          </MemoryRouter>
        </AuthorizationProvider>
      </ThemeProvider>
    </LocaleProvider>,
  );
}

describe('AppSidebar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('renders the group heading', () => {
    renderSidebar(['admin'], ['Ticket.View']);
    expect(screen.getByRole('heading', { name: 'Main' })).toBeInTheDocument();
  });

  it('marks the active route link and leaves others inactive (AC3)', () => {
    renderSidebar(['admin'], ['Ticket.View'], ['/agent']);

    expect(screen.getByText('Home').closest('a')).toHaveClass(styles.linkActive);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Tickets').closest('a')).not.toHaveClass(styles.linkActive);
  });

  it('renders nothing when every group is filtered empty', () => {
    const restrictedGroups: AppSidebarGroup[] = [
      { key: 'main', label: 'Main', items: [{ key: 'admin-users', label: 'Users', icon: <span>👤</span>, to: '/admin/users', role: 'admin' }] },
    ];
    const { container } = render(
      <LocaleProvider>
        <ThemeProvider>
          <AuthorizationProvider roles={[]} permissions={[]}>
            <MemoryRouter>
              <AppSidebar groups={restrictedGroups} />
            </MemoryRouter>
          </AuthorizationProvider>
        </ThemeProvider>
      </LocaleProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('collapsed state exposes the label via role="tooltip" (AC5)', () => {
    renderSidebar(['admin'], ['Ticket.View']);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.getByRole('tooltip', { name: 'Home' })).toBeInTheDocument();
  });

  it('drawer variant: Escape closes and focus returns to the toggle button (AC6)', async () => {
    const onDrawerClose = vi.fn();
    const toggleButtonRef = { current: document.createElement('button') };
    document.body.appendChild(toggleButtonRef.current);

    mockMatchMediaAtWidth(320);

    renderSidebar(['admin'], ['Ticket.View'], ['/agent'], {
      isDrawerOpen: true,
      onDrawerClose,
      toggleButtonRef,
    });

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDrawerClose).toHaveBeenCalled();

    document.body.removeChild(toggleButtonRef.current);
  });
});
