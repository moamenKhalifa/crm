import type { ReactNode } from 'react';

import { useAppStore } from '@app/store/appStore';
import { selectPermissions, selectRoles } from '@app/store/selectors';
import { AuthProvider, useAuth } from '@features/authentication/AuthProvider';
import { ApiClientProvider } from '@shared/api/ApiClientProvider';
import { AuthorizationProvider } from '@shared/authorization';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import { ConfigProvider, useAppConfig } from '../configuration/ConfigProvider';

function ThemeWithConfig({ children }: { children: ReactNode }) {
  const config = useAppConfig();

  return (
    <ThemeProvider
      branding={{
        ...defaultBranding,
        appName: config.brandName ?? defaultBranding.appName,
        logoUrl: config.logoUrl ?? defaultBranding.logoUrl,
      }}
    >
      {children}
    </ThemeProvider>
  );
}

function LocaleWithConfig({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  return <LocaleProvider defaultLocale={config.defaultLocale}>{children}</LocaleProvider>;
}

function AuthorizationWithStore({ children }: { children: ReactNode }) {
  const roles = useAppStore(selectRoles);
  const permissions = useAppStore(selectPermissions);

  return (
    <AuthorizationProvider roles={roles} permissions={permissions}>
      {children}
    </AuthorizationProvider>
  );
}

function ApiClientWithConfig({ children }: { children: ReactNode }) {
  const { apiBaseUrl } = useAppConfig();
  const { getAccessToken, refresh, signOut } = useAuth();

  return (
    <ApiClientProvider
      baseUrl={apiBaseUrl}
      getAuthorizationHeader={() => {
        const token = getAccessToken();
        return token ? `Bearer ${token}` : undefined;
      }}
      onUnauthorized={async () => {
        const refreshed = await refresh();
        if (!refreshed) {
          await signOut();
        }
        return refreshed;
      }}
    >
      {children}
    </ApiClientProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      <ThemeWithConfig>
        <LocaleWithConfig>
          <AuthProvider>
            <AuthorizationWithStore>
              <ApiClientWithConfig>{children}</ApiClientWithConfig>
            </AuthorizationWithStore>
          </AuthProvider>
        </LocaleWithConfig>
      </ThemeWithConfig>
    </ConfigProvider>
  );
}
