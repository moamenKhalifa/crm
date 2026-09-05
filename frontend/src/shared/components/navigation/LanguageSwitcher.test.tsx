import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { LocaleProvider } from '@shared/i18n';
import { ThemeProvider } from '@shared/theme';

import { LanguageSwitcher } from './LanguageSwitcher';

function renderSwitcher(defaultLocale: 'en' | 'ar' = 'en') {
  return render(
    <LocaleProvider defaultLocale={defaultLocale}>
      <ThemeProvider>
        <LanguageSwitcher variant="segmented" />
      </ThemeProvider>
    </LocaleProvider>,
  );
}

describe('LanguageSwitcher', () => {
  it('renders "English" and "العربية" regardless of the current locale (AC9)', () => {
    renderSwitcher('en');
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'العربية' })).toBeInTheDocument();
  });

  it('still renders both native-script labels when the current locale is Arabic (AC9)', () => {
    renderSwitcher('ar');
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'العربية' })).toBeInTheDocument();
  });

  it('the active language carries aria-current (AC9)', () => {
    renderSwitcher('en');
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'العربية' })).not.toHaveAttribute('aria-current');
  });

  it('clicking a language calls setLocale and flips <html dir> with no reload (AC10)', async () => {
    renderSwitcher('en');
    expect(document.documentElement.dir).toBe('ltr');

    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    document.documentElement.dir = '';
  });

  it('has no automated axe violations (G5, G11)', async () => {
    const { container } = renderSwitcher('en');
    expect(await axe(container)).toHaveNoViolations();
  });
});
