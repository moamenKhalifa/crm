import { useLocale, useT } from '@shared/i18n';

import { Dropdown, type DropdownItem } from '../overlay/Dropdown';
import { LANGUAGE_NATIVE_LABEL, LOCALES } from '../navigation/LanguageSwitcher';
import styles from './UserMenu.module.css';

export interface UserMenuProps {
  displayName: string;
  email: string;
  signOutLabel: string;
  onSignOut(): void;
  /** TODO(IA-6): wired once /profile ships. */
  profileHref?: string;
  /** TODO(IA-9): wired once /profile/password ships. */
  changePasswordHref?: string;
  profileLabel?: string;
  changePasswordLabel?: string;
  /** Shown under the display name, e.g. "Administrator". */
  roleLabel?: string;
}

/** Up to two uppercase code points from the first and last whitespace-split tokens — grapheme-safe (`Array.from`) so a non-Latin name like "محمد خليفة" yields "مخ", not mangled surrogate halves. */
function initialsFor(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return '—';
  }
  const first = Array.from(tokens[0])[0] ?? '';
  const last = tokens.length > 1 ? (Array.from(tokens[tokens.length - 1])[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Trigger shows an avatar (initials), the display name, an optional role label, and a chevron — never a token. */
export function UserMenu({
  displayName,
  email,
  signOutLabel,
  onSignOut,
  profileHref,
  changePasswordHref,
  profileLabel,
  changePasswordLabel,
  roleLabel,
}: UserMenuProps) {
  const { locale, setLocale } = useLocale();
  const { t } = useT();
  const label = displayName || email;

  const items: DropdownItem[] = [];

  if (profileHref && profileLabel) {
    items.push({
      key: 'profile',
      label: profileLabel,
      // TODO(IA-6): navigate to `profileHref` once /profile ships.
      onSelect: () => {
        window.location.assign(profileHref);
      },
    });
  }

  if (changePasswordHref && changePasswordLabel) {
    items.push({
      key: 'change-password',
      label: changePasswordLabel,
      // TODO(IA-9): navigate to `changePasswordHref` once /profile/password ships.
      onSelect: () => {
        window.location.assign(changePasswordHref);
      },
    });
  }

  if (items.length > 0) {
    items.push({ key: 'divider-account', divider: true });
  }

  // Keyboard-friendly duplicate of the header `LanguageSwitcher` (AC7): a
  // flat, disabled "heading" item plus the two language choices, rather than
  // a true nested submenu — `Dropdown` has no nested-popover support, and
  // building one just for two items isn't warranted.
  items.push({ key: 'language-heading', label: t('nav.accountMenu.language'), disabled: true, onSelect: () => {} });
  for (const code of LOCALES) {
    items.push({
      key: `language-${code}`,
      label: locale === code ? `${LANGUAGE_NATIVE_LABEL[code]} ✓` : LANGUAGE_NATIVE_LABEL[code],
      onSelect: () => setLocale(code),
    });
  }
  items.push({ key: 'divider-language', divider: true });

  items.push({
    key: 'sign-out',
    label: signOutLabel,
    onSelect: onSignOut,
  });

  return (
    <Dropdown
      align="end"
      triggerAriaLabel={t('nav.accountMenu.label', { name: label })}
      triggerClassName={styles.trigger}
      trigger={
        <>
          <span className={styles.avatar} aria-hidden="true">
            {initialsFor(label)}
          </span>
          <span className={styles.identity}>
            <span className={styles.name}>{label}</span>
            {roleLabel && <span className={styles.role}>{roleLabel}</span>}
          </span>
          <span className={styles.chevron} aria-hidden="true">
            ▾
          </span>
        </>
      }
      items={items}
    />
  );
}
