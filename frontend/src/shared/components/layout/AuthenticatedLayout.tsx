import type { ReactNode } from 'react';

import { defaultBranding, type Branding } from '@shared/theme';

import { AppHeader } from '../navigation/AppHeader';
import { UserMenu } from './UserMenu';

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
  children: ReactNode;
}

/**
 * Composes `AppHeader` + `UserMenu` for every authenticated area. Takes the
 * display name / sign-out handler as props rather than reading `useAuth()`
 * directly — this component lives in `shared/`, which must not import
 * `features/` (see `AuthorizationProvider.tsx` for the same rule).
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
  children,
}: AuthenticatedLayoutProps) {
  return (
    <>
      <AppHeader
        branding={branding}
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
          />
        }
      />
      {children}
    </>
  );
}
