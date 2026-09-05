import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { useT } from '@shared/i18n';
import { defaultBranding, type Branding } from '@shared/theme';

import { AppHeader } from '../navigation/AppHeader';
import { AppSidebar, type AppSidebarGroup } from '../navigation/AppSidebar';
import { LanguageSwitcher } from '../navigation/LanguageSwitcher';
import { UserMenu } from './UserMenu';
import styles from './AuthenticatedLayout.module.css';

export interface AuthenticatedLayoutProps {
  displayName: string;
  email: string;
  signOutLabel: string;
  onSignOut(): void;
  branding?: Branding;
  profileHref?: string;
  changePasswordHref?: string;
  profileLabel?: string;
  changePasswordLabel?: string;
  roleLabel?: string;
  /** Sidebar content — pages that render inside an empty-groups area (e.g. no sidebar entries yet) simply get no sidebar/no drawer toggle. */
  groups: AppSidebarGroup[];
  /** Optional per-route title; when set, becomes `"{pageTitle} – {appName}"`. */
  pageTitle?: string;
  children: ReactNode;
}

const SIDEBAR_ID = 'app-sidebar';

/**
 * Owns the whole authenticated shell: skip link, header (logo, language
 * switcher, account menu, mobile drawer toggle), sidebar, `main` landmark,
 * footer, and the route-change focus/announcement behaviour (AC12–AC14).
 *
 * Takes identity data as props rather than reading `useAuth()` directly —
 * this component lives in `shared/`, which must not import `features/` (see
 * `AuthorizationProvider.tsx` for the same rule). `AuthenticatedShell.tsx`
 * (in `features/authentication/`) is the real caller.
 */
export function AuthenticatedLayout({
  displayName,
  email,
  signOutLabel,
  onSignOut,
  branding = defaultBranding,
  profileHref,
  changePasswordHref,
  profileLabel,
  changePasswordLabel,
  roleLabel,
  groups,
  pageTitle,
  children,
}: AuthenticatedLayoutProps) {
  const { t } = useT();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} – ${branding.appName}` : branding.appName;
  }, [pageTitle, branding.appName]);

  useEffect(() => {
    // Focus the page heading first, then announce — in that order, so
    // screen readers don't double-speak the same content (see the story's
    // edge-cases note on AC14).
    const heading = document.getElementById('page-heading');
    if (heading) {
      heading.focus();
    } else {
      mainRef.current?.focus();
    }
    setLiveMessage(pageTitle || branding.appName);
    setDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <a
        href="#main"
        className={styles.skipLink}
        onClick={(event) => {
          // Explicit `.focus()` rather than relying on the browser's native
          // fragment-navigation focus behaviour — jsdom doesn't implement
          // that, and this way the behaviour is the same everywhere.
          // Focusing an off-screen element already scrolls it into view
          // natively, so no separate `scrollIntoView()` call is needed.
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        {t('nav.skipToContent')}
      </a>
      <AppHeader
        branding={branding}
        menuToggle={
          groups.length > 0 ? (
            <button
              ref={toggleRef}
              type="button"
              className={styles.menuToggle}
              aria-controls={SIDEBAR_ID}
              aria-expanded={drawerOpen}
              aria-label={t('nav.header.menu')}
              onClick={() => setDrawerOpen((value) => !value)}
            >
              ☰
            </button>
          ) : undefined
        }
        languageSwitcher={<LanguageSwitcher />}
        userMenu={
          <UserMenu
            displayName={displayName}
            email={email}
            signOutLabel={signOutLabel}
            onSignOut={onSignOut}
            profileHref={profileHref}
            changePasswordHref={changePasswordHref}
            profileLabel={profileLabel}
            changePasswordLabel={changePasswordLabel}
            roleLabel={roleLabel}
          />
        }
      />
      <div className={styles.body}>
        <AppSidebar
          id={SIDEBAR_ID}
          groups={groups}
          isDrawerOpen={drawerOpen}
          onDrawerClose={() => setDrawerOpen(false)}
          toggleButtonRef={toggleRef}
        />
        <main id="main" tabIndex={-1} ref={mainRef} className={styles.main}>
          {children}
        </main>
      </div>
      <footer role="contentinfo" className={styles.footer}>
        {t('nav.footer.copy', { year: new Date().getFullYear() })}
      </footer>
      <div aria-live="polite" role="status" className={styles.srOnly}>
        {liveMessage}
      </div>
    </>
  );
}
