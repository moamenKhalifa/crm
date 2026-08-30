import type { ReactNode } from 'react';

import type { Branding } from '@shared/theme';

import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  branding: Branding;
  userMenu?: ReactNode;
  languageSwitcher?: ReactNode;
}

export function AppHeader({ branding, userMenu, languageSwitcher }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={branding.logoUrl} alt={branding.logoAlt} className={styles.logo} />
        <span className={styles.appName}>{branding.appName}</span>
      </div>
      <div className={styles.actions}>
        {languageSwitcher}
        {userMenu}
      </div>
    </header>
  );
}
