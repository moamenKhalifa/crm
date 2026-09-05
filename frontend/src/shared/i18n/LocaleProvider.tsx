import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, { initI18n } from './config';
import { applyDocumentDirection, directionFor, LOCALE_STORAGE_KEY, type Direction, type Locale } from './documentDirection';

export type { Locale, Direction };

export interface LocaleContextValue {
  locale: Locale;
  setLocale(locale: Locale): void;
  dir: Direction;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

// Read only at mount — a locale change in another tab does not propagate to
// this one until it reloads (or itself calls `setLocale`, which overwrites
// the stored value). Acceptable per AC11 ("applied on next visit"); a
// cross-tab `storage` event listener would close this gap but isn't
// currently needed.
function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
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
    applyDocumentDirection(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Storage disabled (e.g. Safari private mode) — locale still applies for this session.
    }
    // TODO(IA-6): also persist to the signed-in user's profile via
    // `PATCH /identity/users/me/preferences` once that endpoint ships (no
    // such route exists in `backend/app/modules/identity_access/api/routers/`
    // today). Until then, `localStorage` already satisfies AC11's "applied
    // on next visit" for both signed-out and signed-in users on this device.
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
