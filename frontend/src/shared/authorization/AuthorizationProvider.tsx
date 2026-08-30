import { createContext, useMemo, type ReactNode } from 'react';

export interface AuthorizationContextValue {
  roles: string[];
  permissions: string[];
}

export const AuthorizationContext = createContext<AuthorizationContextValue | undefined>(undefined);

export interface AuthorizationProviderProps extends AuthorizationContextValue {
  children: ReactNode;
}

/**
 * Receives `roles`/`permissions` as props rather than reading the app store
 * directly — `shared/` must not import from `app/`.
 * `app/providers/AppProviders.tsx` composes this from `useAppStore`.
 */
export function AuthorizationProvider({ roles, permissions, children }: AuthorizationProviderProps) {
  const value = useMemo<AuthorizationContextValue>(() => ({ roles, permissions }), [roles, permissions]);
  return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
}
