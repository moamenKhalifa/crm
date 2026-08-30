import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { HttpClient, type AuthHeaderSupplier } from './httpClient';

const ApiClientContext = createContext<HttpClient | undefined>(undefined);

export interface ApiClientProviderProps {
  children: ReactNode;
  baseUrl: string;
  getAuthorizationHeader?: AuthHeaderSupplier;
  onUnauthorized?: () => Promise<boolean>;
  onForbidden?: () => void;
}

/**
 * Takes `baseUrl`/`getAuthorizationHeader`/`onUnauthorized`/`onForbidden` as
 * props rather than reading config or auth context directly — `shared/`
 * must not import from `app/` or `features/`. `app/providers/AppProviders.tsx`
 * supplies these values.
 */
export function ApiClientProvider({
  children,
  baseUrl,
  getAuthorizationHeader,
  onUnauthorized,
  onForbidden,
}: ApiClientProviderProps) {
  const client = useMemo(
    () => new HttpClient({ baseUrl, getAuthorizationHeader, onUnauthorized, onForbidden }),
    [baseUrl, getAuthorizationHeader, onUnauthorized, onForbidden],
  );

  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

export function useApiClient(): HttpClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return client;
}
