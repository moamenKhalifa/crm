import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
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

describe('DataTablePage accessibility', () => {
  it('the States section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-datatable-states-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the row-actions overflow section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-datatable-overflow-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the RTL preview section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-datatable-rtl-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);
});
