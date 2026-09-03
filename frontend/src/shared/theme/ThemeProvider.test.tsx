import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { LocaleProvider } from '@shared/i18n';

import { ThemeProvider, useTheme } from './ThemeProvider';

function Probe() {
  const { theme, setThemeName } = useTheme();
  return (
    <div>
      <span data-testid="theme-name">{theme.name}</span>
      <button onClick={() => setThemeName('dark')}>go dark</button>
    </div>
  );
}

function renderWithLocale(defaultLocale: 'en' | 'ar' = 'en') {
  return render(
    <LocaleProvider defaultLocale={defaultLocale}>
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    </LocaleProvider>,
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('switching theme writes new CSS variables to document.documentElement.style', async () => {
    renderWithLocale();

    // Semantic aliases now resolve via `var()`, never a literal hex —
    // `--color-primary` is a legacy alias pointing at `--color-action`.
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('var(--color-action)');
    expect(document.documentElement.style.getPropertyValue('--color-action')).toBe('var(--blue-600)');

    screen.getByText('go dark').click();

    // Story 10's dark theme is a placeholder that reuses the light alias
    // values, so `--color-action` stays present and unchanged after the switch.
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--color-action')).toBe('var(--blue-600)'),
    );
  });

  it('persists the selection to localStorage', async () => {
    renderWithLocale();

    screen.getByText('go dark').click();

    await waitFor(() => expect(window.localStorage.getItem('crm.theme')).toBe('dark'));
  });

  it('sets data-locale to the active locale on mount', async () => {
    renderWithLocale('en');
    await waitFor(() => expect(document.documentElement.dataset.locale).toBe('en'));
  });

  it('resolves --line-height-sm to the Arabic value when the locale is ar', async () => {
    renderWithLocale('ar');
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--line-height-sm')).toBe(
        'var(--line-height-sm-arabic)',
      ),
    );
  });

  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme(), { wrapper: LocaleProvider })).toThrow(
      'useTheme must be used within ThemeProvider',
    );
  });
});
