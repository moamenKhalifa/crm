import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, { initI18n } from './config';

const STORAGE_KEY = 'crm.locale';

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface LocaleContextValue {
  locale: Locale;
  setLocale(locale: Locale): void;
  dir: Direction;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function directionFor(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'ar' ? stored : null;
  } catch {
    return null;
  }
}

export interface LocaleProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function LocaleProvider({ children, defaultLocale = 'en' }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale() ?? defaultLocale);

  useEffect(() => {
    initI18n(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = directionFor(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage disabled (e.g. Safari private mode) — locale still applies for this session.
    }
  };

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, dir: directionFor(locale) }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
