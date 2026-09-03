import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '@shared/i18n';

import { ThemeProvider } from './ThemeProvider';
import { lightTheme } from './tokens';
import { useBreakpoint } from './useBreakpoint';

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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LocaleProvider>
  );
}

describe('useBreakpoint', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns "mobile" below the tablet breakpoint', () => {
    mockMatchMediaAtWidth(320);
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(result.current).toBe('mobile');
  });

  it('returns "tablet" at the tablet breakpoint', () => {
    mockMatchMediaAtWidth(lightTheme.breakpoints.tablet);
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(result.current).toBe('tablet');
  });

  it('returns "desktop" at the desktop breakpoint', () => {
    mockMatchMediaAtWidth(lightTheme.breakpoints.desktop);
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(result.current).toBe('desktop');
  });

  it('returns "wide" at the wide breakpoint', () => {
    mockMatchMediaAtWidth(lightTheme.breakpoints.wide);
    const { result } = renderHook(() => useBreakpoint(), { wrapper });
    expect(result.current).toBe('wide');
  });
});
