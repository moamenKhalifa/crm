import { useState, type ReactNode } from 'react';

import { useT } from '@shared/i18n';
import { versionedLogoUrl, type Branding } from '@shared/theme';

import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  branding: Branding;
  userMenu?: ReactNode;
  languageSwitcher?: ReactNode;
  /** The `☰` drawer-toggle button, owned by the caller so it can share a ref with the sidebar. */
  menuToggle?: ReactNode;
}

// `alt=""` (decorative) rather than `branding.logoAlt` — the always-present
// `.appName` span right next to this one already renders the same brand name
// as visible text, and the wrapping `<a>` carries its own `aria-label`
// ("Home") that overrides the link's accessible name regardless. Giving the
// image its own non-empty alt here would just duplicate that text for
// screen readers (axe's `image-redundant-alt` rule) — and, on a load
// failure, renders nothing rather than a duplicate text node, since the
// `.appName` span already reads as the "no broken image" text fallback (AC1).
function LogoOrFallback({ branding }: { branding: Branding }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img src={versionedLogoUrl(branding)} alt="" className={styles.logo} onError={() => setFailed(true)} />
  );
}

export function AppHeader({ branding, userMenu, languageSwitcher, menuToggle }: AppHeaderProps) {
  const { t } = useT();

  return (
    <header className={styles.header} role="banner">
      {menuToggle}
      <a href="/" className={styles.brandLink} aria-label={t('nav.header.home')}>
        <LogoOrFallback branding={branding} />
        <span className={styles.appName}>{branding.appName}</span>
      </a>
      <div className={styles.actions}>
        {languageSwitcher}
        {userMenu}
      </div>
    </header>
  );
}
