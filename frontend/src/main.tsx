import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppRoot } from '@app/AppRoot';
import { applyDocumentDirection, LOCALE_STORAGE_KEY, type Locale } from '@shared/i18n';

import '@app/configuration/global.css';

// Applied on this tick, before React's first render, so `<html dir>`/`lang`
// are correct on the very first paint — no flash (AC10). `LocaleProvider`'s
// own effect re-applies this on every later runtime locale change.
function resolveInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') {
      return stored;
    }
  } catch {
    // Storage disabled (e.g. Safari private mode) — fall through to the build-time default.
  }
  const fallback = import.meta.env.VITE_DEFAULT_LOCALE;
  return fallback === 'ar' ? 'ar' : 'en';
}

applyDocumentDirection(resolveInitialLocale());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
