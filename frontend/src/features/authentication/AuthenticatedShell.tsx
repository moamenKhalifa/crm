import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthenticatedLayout } from '@shared/components';
import { useT } from '@shared/i18n';

import { useAuth } from './AuthProvider';
import { buildShellNavigation } from './shellNavigation';

export interface AuthenticatedShellProps {
  children: ReactNode;
}

type TFn = (key: string, options?: Record<string, unknown>) => string;

// A role is picked by this convention — the most privileged role a user
// holds is the one shown under their name in the account menu.
const ROLE_PRIORITY = ['admin', 'agent', 'customer'] as const;

function pickRoleLabel(roles: string[], t: TFn): string | undefined {
  const matched = ROLE_PRIORITY.find((role) => roles.includes(role));
  return matched ? t(`nav.roleLabel.${matched}`) : undefined;
}

// A route→title lookup rather than a full page-title context/hook — this
// story's routes are few and known; revisit with a proper per-page API if
// the route tree grows past the areas covered here.
function titleForPath(pathname: string, t: TFn): string | undefined {
  if (pathname.startsWith('/admin/users')) {
    return t('admin.users.title');
  }
  if (pathname.startsWith('/admin/roles')) {
    return t('admin.roles.title');
  }
  if (pathname.startsWith('/admin/permissions')) {
    return t('admin.permissions.title');
  }
  if (pathname.startsWith('/agent')) {
    return t('nav.areas.agent');
  }
  if (pathname.startsWith('/portal')) {
    return t('nav.areas.portal');
  }
  return undefined;
}

/** Binds `useAuth()` to `AuthenticatedLayout` — lives in `features/` so it may import auth context. */
export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const { t } = useT();
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    // `AuthProvider.signOut` never throws — it clears local state even when
    // the server call fails — so the redirect always follows.
    await signOut();
    navigate('/login?signedOut=1', { replace: true });
  };

  return (
    <AuthenticatedLayout
      displayName={user?.fullName ?? ''}
      email={user?.email ?? ''}
      signOutLabel={t('auth.signOut')}
      onSignOut={handleSignOut}
      roleLabel={pickRoleLabel(roles, t)}
      groups={buildShellNavigation(t)}
      pageTitle={titleForPath(location.pathname, t)}
      // TODO(IA-6 / IA-9): wire real routes once /profile and
      // /profile/password ship.
      profileHref="/profile"
      changePasswordHref="/profile/password"
      profileLabel={t('auth.userMenu.myProfile')}
      changePasswordLabel={t('auth.userMenu.changePassword')}
    >
      {children}
    </AuthenticatedLayout>
  );
}
