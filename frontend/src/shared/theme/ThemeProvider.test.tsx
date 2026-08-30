import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

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

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('switching theme writes new CSS variables to document.documentElement.style', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#2563eb');

    screen.getByText('go dark').click();

    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#3b82f6'),
    );
  });

  it('persists the selection to localStorage', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    screen.getByText('go dark').click();

    await waitFor(() => expect(window.localStorage.getItem('crm.theme')).toBe('dark'));
  });

  it('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
  });
});
