import { useContext } from 'react';

import { AuthorizationContext, type AuthorizationContextValue } from './AuthorizationProvider';

export interface AuthorizationHelpers {
  hasRole(role: string): boolean;
  hasAnyRole(...roles: string[]): boolean;
  hasPermission(permission: string): boolean;
  hasAnyPermission(...permissions: string[]): boolean;
  hasAllPermissions(...permissions: string[]): boolean;
}

/**
 * Reads roles/permissions from `AuthorizationContext` by default. Pass an
 * explicit `input` to bypass the provider — lets tests inject fixture
 * roles/permissions without mounting one.
 */
export function useAuthorization(input?: AuthorizationContextValue): AuthorizationHelpers {
  const context = useContext(AuthorizationContext);
  const source = input ?? context;

  if (!source) {
    throw new Error('useAuthorization must be used within AuthorizationProvider, or given an explicit input');
  }

  const { roles, permissions } = source;

  return {
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (...candidates) => candidates.length === 0 || candidates.some((role) => roles.includes(role)),
    hasPermission: (permission) => permissions.includes(permission),
    hasAnyPermission: (...candidates) =>
      candidates.length === 0 || candidates.some((permission) => permissions.includes(permission)),
    hasAllPermissions: (...candidates) => candidates.every((permission) => permissions.includes(permission)),
  };
}
