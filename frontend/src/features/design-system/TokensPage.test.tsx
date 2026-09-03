import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import { contrastMap } from './contrastMap';
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

describe('TokensPage', () => {
  it('renders a row for every semantic colour alias with its contrast string', () => {
    renderPage();

    expect(screen.getByText('--color-action')).toBeInTheDocument();
    expect(screen.getByText(contrastMap.action)).toBeInTheDocument();
    expect(screen.getByText('--color-danger-solid')).toBeInTheDocument();
    expect(screen.getByText(contrastMap.dangerSolid)).toBeInTheDocument();
  });

  it('renders the six documented sections', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Colours' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spacing' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Radii' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shadows' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Typography' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Motion' })).toBeInTheDocument();
  });

  it('renders both a Latin and an Arabic typography sample at every step', () => {
    renderPage();

    expect(screen.getByText('--text-xs (12px)')).toBeInTheDocument();
    expect(screen.getByText('--text-3xl (30px)')).toBeInTheDocument();
    // Seven steps × two scripts each.
    expect(screen.getAllByText(/quick brown fox/)).toHaveLength(14);
  });

  it('renders a motion demo button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('renders the Forms section with each documented control at least once (G10)', () => {
    renderPage();

    const section = screen.getByTestId('ds-forms-section');
    expect(section).toBeInTheDocument();

    // Role-scoped queries — `getByLabelText` would also match the
    // surrounding `<FormSection aria-labelledby>` wrapper, since its
    // heading happens to repeat the same control name for documentation
    // purposes.
    expect(within(section).getByRole('textbox', { name: 'Text input' })).toBeInTheDocument();
    expect(within(section).getByRole('textbox', { name: 'Text area' })).toBeInTheDocument();
    expect(section.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(within(section).getByRole('textbox', { name: 'Email input' })).toBeInTheDocument();
    expect(within(section).getByRole('textbox', { name: 'Code input' })).toBeInTheDocument();
    expect(within(section).getByRole('searchbox')).toBeInTheDocument();
    expect(within(section).getByRole('combobox', { name: 'Select' })).toBeInTheDocument();
    expect(within(section).getByRole('checkbox', { name: 'Checkbox' })).toBeInTheDocument();
    expect(within(section).getByRole('radio', { name: 'Radio' })).toBeInTheDocument();
    expect(within(section).getByRole('radiogroup')).toBeInTheDocument();
    expect(within(section).getByRole('switch')).toBeInTheDocument();
    expect(within(section).getAllByRole('button', { name: 'Form actions' }).length).toBeGreaterThan(0);
    expect(within(section).getAllByText('Planned — see Story 13')).toHaveLength(3);
  });

  it('renders the Button section with one sample per variant', () => {
    renderPage();

    const section = screen.getByTestId('ds-button-section');
    expect(section).toBeInTheDocument();

    for (const variant of ['primary', 'secondary', 'tertiary', 'danger', 'danger-subtle', 'link']) {
      const buttons = section.querySelectorAll(`button[data-variant="${variant}"]`);
      expect(buttons.length).toBeGreaterThan(0);
    }
  });
});
