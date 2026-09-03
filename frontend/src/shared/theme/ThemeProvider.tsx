import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useLocale } from '@shared/i18n/LocaleProvider';

import type { Branding } from './branding';
import { defaultBranding } from './branding';
import { applyThemeToRoot } from './cssVariables';
import { darkTheme, lightTheme, type ThemeTokens } from './tokens';

const STORAGE_KEY = 'crm.theme';

export interface ThemeContextValue {
  theme: ThemeTokens;
  setThemeName(name: ThemeTokens['name']): void;
  branding: Branding;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredThemeName(): ThemeTokens['name'] | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function resolveInitialThemeName(): ThemeTokens['name'] {
  return readStoredThemeName() ?? (prefersDark() ? 'dark' : 'light');
}

export interface ThemeProviderProps {
  children: ReactNode;
  branding?: Branding;
}

export function ThemeProvider({ children, branding = defaultBranding }: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeTokens['name']>(resolveInitialThemeName);
  const { locale } = useLocale();

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    applyThemeToRoot(theme, locale);
  }, [theme, locale]);

  const setThemeName = (name: ThemeTokens['name']) => {
    setThemeNameState(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Storage disabled (e.g. Safari private mode) — theme still applies for this session.
    }
  };

  const value = useMemo<ThemeContextValue>(() => ({ theme, setThemeName, branding }), [theme, branding]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
