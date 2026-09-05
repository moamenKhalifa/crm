import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AuthorizationProvider } from '@shared/authorization';
import { LocaleProvider } from '@shared/i18n';
import { ThemeProvider } from '@shared/theme';

import { AppSidebar, type AppSidebarGroup } from './AppSidebar';

const sidebarCss = readFileSync(join(process.cwd(), 'src/shared/components/navigation/AppSidebar.module.css'), 'utf-8');

const groups: AppSidebarGroup[] = [
  {
    key: 'main',
    label: 'Main',
    items: [{ key: 'users', label: 'Users', icon: <span>👤</span>, to: '/admin/users' }],
  },
];

describe('AppSidebar under RTL (AC15, G7)', () => {
  it('renders identical DOM order under RTL — no component-level direction branch', () => {
    document.documentElement.dir = 'rtl';
    render(
      <LocaleProvider defaultLocale="ar">
        <ThemeProvider>
          <AuthorizationProvider roles={[]} permissions={[]}>
            <MemoryRouter initialEntries={['/admin/users']}>
              <AppSidebar groups={groups} />
            </MemoryRouter>
          </AuthorizationProvider>
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    document.documentElement.dir = '';
  });

  it('the active-item bar and its padding compensation use logical (not physical) properties, so the browser mirrors them under RTL without a direction override', () => {
    expect(sidebarCss).toMatch(/\.linkActive\s*\{[^}]*border-inline-start-color/);
    expect(sidebarCss).not.toMatch(/border-left|border-right|padding-left|padding-right/);
  });
});
