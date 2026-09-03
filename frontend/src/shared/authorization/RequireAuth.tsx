import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { AppSplash } from '@shared/components/AppSplash';

import { useAuthorization } from './useAuthorization';

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';

export interface RequireAuthProps {
  children: ReactElement;
  /**
   * Supplied by the caller (e.g. `app/routing/AppRouter.tsx`, reading
   * `useAuth()`) — `shared/` cannot import `features/authentication` itself.
   */
  status: AuthStatus;
  role?: string;
  anyRole?: string[];
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  /** Where to send an authenticated-but-unauthorized visitor. Default `/forbidden`. */
  redirectTo?: string;
}

export function RequireAuth({
  children,
  status,
  role,
  anyRole,
  permission,
  anyPermission,
  allPermissions,
  redirectTo,
}: RequireAuthProps) {
  const location = useLocation();
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization();

  if (status === 'unknown') {
    return <AppSplash />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const authorized =
    (!role || hasRole(role)) &&
    (!anyRole || hasAnyRole(...anyRole)) &&
    (!permission || hasPermission(permission)) &&
    (!anyPermission || hasAnyPermission(...anyPermission)) &&
    (!allPermissions || hasAllPermissions(...allPermissions));

  if (!authorized) {
    return <Navigate to={redirectTo ?? '/forbidden'} replace />;
  }

  return children;
}
