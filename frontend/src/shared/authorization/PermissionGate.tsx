import type { ReactNode } from 'react';

import { useAuthorization } from './useAuthorization';

export interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  role?: string;
  anyRole?: string[];
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
}

/** UI-only gate — hides/shows `children`. The backend remains the final security boundary. */
export function PermissionGate({
  children,
  fallback = null,
  role,
  anyRole,
  permission,
  anyPermission,
  allPermissions,
}: PermissionGateProps) {
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization();

  const authorized =
    (!role || hasRole(role)) &&
    (!anyRole || hasAnyRole(...anyRole)) &&
    (!permission || hasPermission(permission)) &&
    (!anyPermission || hasAnyPermission(...anyPermission)) &&
    (!allPermissions || hasAllPermissions(...allPermissions));

  return authorized ? <>{children}</> : <>{fallback}</>;
}
