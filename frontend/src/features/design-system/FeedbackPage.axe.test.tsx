import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import FeedbackPage from './FeedbackPage';

// `NotFound`/`AccessDenied` (rendered inside the page-states section) call
// `useNavigate()` — a `MemoryRouter` here supplies that context. The real
// app already renders this page inside `AppRouter`'s single `BrowserRouter`,
// so `FeedbackPage` itself never mounts a `Router` of its own.
function renderPage() {
  return render(
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider branding={defaultBranding}>
          <MemoryRouter>
            <FeedbackPage />
          </MemoryRouter>
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('FeedbackPage accessibility', () => {
  it('the Toast section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-feedback-toast-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the Alert section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-feedback-alert-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the page-states section has no automated axe violations (G11)', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-feedback-page-states-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the Badge & Status section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-feedback-badge-status-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);

  it('the RTL preview section has no automated axe violations', async () => {
    const { container } = renderPage();
    const section = container.querySelector('[data-testid="ds-feedback-rtl-section"]');
    expect(section).toBeTruthy();

    const results = await axe(section as HTMLElement);
    expect(results).toHaveNoViolations();
  }, 20_000);
});
