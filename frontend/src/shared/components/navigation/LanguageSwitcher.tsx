import { useState } from 'react';

import { useLocale, useT, type Locale } from '@shared/i18n';
import { useBreakpoint } from '@shared/theme';

import { Dropdown, type DropdownItem } from '../overlay/Dropdown';
import styles from './LanguageSwitcher.module.css';

export interface LanguageSwitcherProps {
  /** `'auto'` (default) renders a segmented control at `tablet` and up, and a menu at `mobile`. */
  variant?: 'auto' | 'segmented' | 'menu';
}

// Each language is always labelled in its own script, regardless of the
// current interface locale (AC9) — deliberately not resolved through `t()`.
// Exported so `UserMenu`'s keyboard-friendly duplicate switcher (AC7) reuses
// the same source of truth instead of a second copy of this map.
export const LANGUAGE_NATIVE_LABEL: Record<Locale, string> = { en: 'English', ar: 'العربية' };
export const LOCALES: Locale[] = ['en', 'ar'];

export function LanguageSwitcher({ variant = 'auto' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const { t } = useT();
  const breakpoint = useBreakpoint();
  const [announcement, setAnnouncement] = useState('');

  const resolved = variant === 'auto' ? (breakpoint === 'mobile' ? 'menu' : 'segmented') : variant;

  const handleChange = (next: Locale) => {
    if (next === locale) {
      return;
    }
    // TODO(IA-6): also persist to the signed-in user's profile once a
    // preferences endpoint exists — see `LocaleProvider.tsx#setLocale`.
    setLocale(next);
    setAnnouncement(t('nav.langSwitcher.announce', { language: LANGUAGE_NATIVE_LABEL[next] }));
  };

  // A local live region (rather than a shared one threaded down from
  // `AuthenticatedLayout`) so this component announces correctly whether
  // it's mounted inside the authenticated shell or standalone on a public
  // auth screen (`/login`, `/register`) — both need AC8 coverage.
  const liveRegion = (
    <div aria-live="polite" role="status" className={styles.srOnly}>
      {announcement}
    </div>
  );

  if (resolved === 'menu') {
    const items: DropdownItem[] = LOCALES.map((code) => ({
      key: code,
      label: (
        <span className={styles.menuOption}>
          {LANGUAGE_NATIVE_LABEL[code]}
          {locale === code && (
            <span aria-hidden="true" className={styles.check}>
              ✓
            </span>
          )}
        </span>
      ),
      onSelect: () => handleChange(code),
    }));

    return (
      <>
        <Dropdown
          trigger={LANGUAGE_NATIVE_LABEL[locale]}
          items={items}
          align="end"
          triggerAriaLabel={t('nav.langSwitcher.label')}
        />
        {liveRegion}
      </>
    );
  }

  return (
    <>
      <nav aria-label={t('nav.langSwitcher.label')} className={styles.segmented}>
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            className={styles.option}
            data-active={locale === code || undefined}
            aria-current={locale === code ? 'true' : undefined}
            aria-pressed={locale === code}
            onClick={() => handleChange(code)}
          >
            {LANGUAGE_NATIVE_LABEL[code]}
          </button>
        ))}
      </nav>
      {liveRegion}
    </>
  );
}
