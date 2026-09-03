import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { HttpClient } from './httpClient';

const ApiClientContext = createContext<HttpClient | undefined>(undefined);

export interface ApiClientProviderProps {
  children: ReactNode;
  baseUrl: string;
  publicEndpoints?: readonly string[];
  onSessionExpired?: () => Promise<boolean>;
  onForbidden?: () => void;
}

/**
 * Takes `baseUrl`/`onSessionExpired`/`onForbidden`/`publicEndpoints` as props
 * rather than reading config or auth context directly — `shared/` must not
 * import from `app/` or `features/`. `app/providers/AppProviders.tsx`
 * supplies these values. The access token itself is read by `HttpClient`
 * straight from the module-scoped `tokenStore`, not passed through here.
 */
export function ApiClientProvider({ children, baseUrl, publicEndpoints, onSessionExpired, onForbidden }: ApiClientProviderProps) {
  const client = useMemo(
    () => new HttpClient({ baseUrl, publicEndpoints, onSessionExpired, onForbidden }),
    [baseUrl, publicEndpoints, onSessionExpired, onForbidden],
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
