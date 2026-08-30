import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import arCommon from './locales/ar/common.json';
import enCommon from './locales/en/common.json';

export const defaultNS = 'common';

export const resources = {
  en: { common: enCommon },
  ar: { common: arCommon },
} as const;

let initialized = false;

/** Initialises i18next once per app lifetime; subsequent calls just switch language. */
export function initI18n(defaultLocale: 'en' | 'ar' = 'en'): typeof i18next {
  if (!initialized) {
    void i18next.use(initReactI18next).init({
      resources,
      lng: defaultLocale,
      fallbackLng: 'en',
      defaultNS,
      ns: [defaultNS],
      interpolation: { escapeValue: false },
    });
    initialized = true;
  } else if (i18next.language !== defaultLocale) {
    void i18next.changeLanguage(defaultLocale);
  }
  return i18next;
}

// Eagerly initialise (defaulting to 'en') the moment this module is first
// imported by anyone — including `RootErrorBoundary`, which renders outside
// `LocaleProvider` (it's the outermost wrapper, see AppRoot.tsx) and must
// never show blank fallback text if it catches an error before
// `LocaleProvider` has mounted. `LocaleProvider`'s effect calls `initI18n`
// again with the resolved locale, which — since already initialised — just
// switches language.
initI18n('en');

export default i18next;
