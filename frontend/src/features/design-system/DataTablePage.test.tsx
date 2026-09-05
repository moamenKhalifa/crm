import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import DataTablePage from './DataTablePage';

function renderPage() {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider branding={defaultBranding}>
          <DataTablePage />
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('DataTablePage', () => {
  it('renders the guidance section', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'When to use / when not to use' })).toBeInTheDocument();
  });

  it('renders the API reference table with every documented prop', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-api-section');
    expect(within(section).getByText('rowKey')).toBeInTheDocument();
    expect(within(section).getByText('onStateChange')).toBeInTheDocument();
    expect(within(section).getByText('rowLabel')).toBeInTheDocument();
  });

  it('renders every documented state as its own live table', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-states-section');
    expect(within(section).getByRole('heading', { name: 'Default' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Sorted' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Loading' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Refetching (partial)' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Empty' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Empty, with filters active' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Error' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Disabled row action' })).toBeInTheDocument();

    // Default state renders real mock rows.
    expect(within(section).getAllByText('Amina Haddad').length).toBeGreaterThan(0);
    // Error state renders the simulated error message and a retry button.
    expect(within(section).getByText(/simulated error for documentation/)).toBeInTheDocument();
    expect(within(section).getAllByRole('button', { name: 'Retry' }).length).toBeGreaterThan(0);
  });

  it('renders the disabled-row-action demo with a surfaced reason', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-states-section');
    // Amina is an Admin, so her Edit action is allowed; a non-admin row's Edit is disabled.
    const disabledEdit = within(section).getAllByRole('button', { name: /Edit — Bilal Karam/ })[0];
    expect(disabledEdit).toBeDisabled();
  });

  it('renders the RTL preview wrapped in a dir="rtl" container', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-rtl-section');
    const rtlContainer = section.querySelector('[dir="rtl"]');
    expect(rtlContainer).toBeTruthy();
    expect(within(rtlContainer as HTMLElement).getByRole('table')).toBeInTheDocument();
  });

  it('renders the row-actions overflow demo with more than 3 actions per row', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-overflow-section');
    expect(within(section).getAllByRole('button', { name: /More actions for/ }).length).toBeGreaterThan(0);
  });

  it('renders the mobile card layout demo', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-mobile-section');
    expect(section.querySelector('table')).toBeNull();
    expect(within(section).getAllByRole('article').length).toBe(4);
  });

  it('demonstrates formatDateTime with a Joined column showing an ISO dateTime', () => {
    renderPage();
    const section = screen.getByTestId('ds-datatable-states-section');
    const timeElements = section.querySelectorAll('time');
    expect(timeElements.length).toBeGreaterThan(0);
    expect(timeElements[0]).toHaveAttribute('dateTime');
  });
});
