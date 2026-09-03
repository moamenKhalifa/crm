import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import TokensPage from './TokensPage';

function renderPage() {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider branding={defaultBranding}>
          <TokensPage />
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('TokensPage accessibility', () => {
  it('the Button section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-button-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the Forms section has no automated axe violations (G11)', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-forms-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);
});
