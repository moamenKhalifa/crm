import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthenticatedLayout } from '@shared/components';
import { useT } from '@shared/i18n';

import { useAuth } from './AuthProvider';

export interface AuthenticatedShellProps {
  children: ReactNode;
}

/** Binds `useAuth()` to `AuthenticatedLayout` — lives in `features/` so it may import auth context. */
export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const { t } = useT();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
