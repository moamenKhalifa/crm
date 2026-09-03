export const LOCALE_STORAGE_KEY = 'crm.locale';

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export function directionFor(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Applied synchronously from `main.tsx` before React's first render (AC10),
 * and again from `LocaleProvider`'s effect on every runtime locale change —
 * see that call site for why the synchronous call only covers first paint.
 *
 * Also sets `data-locale`, which `global.css`'s `html[data-locale]` selector
 * reads to switch `--font-family-base` and every `--line-height-*` alias
 * between the Latin and Arabic sets before `ThemeProvider` even mounts.
 */
export function applyDocumentDirection(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = directionFor(locale);
  document.documentElement.dataset.locale = locale;
}
