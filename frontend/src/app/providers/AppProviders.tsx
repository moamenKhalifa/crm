import type { ReactNode } from 'react';

import { useAppStore } from '@app/store/appStore';
import { selectPermissions, selectRoles } from '@app/store/selectors';
import { AuthProvider, useAuth } from '@features/authentication/AuthProvider';
import { ApiClientProvider } from '@shared/api/ApiClientProvider';
import { AuthorizationProvider } from '@shared/authorization';
import { AppSplash, ToastProvider, useToast } from '@shared/components';
import { LocaleProvider, useT } from '@shared/i18n';
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
  const { refresh, signOut, reloadAuthContext } = useAuth();
  const { t } = useT();
  const toast = useToast();

  return (
    <ApiClientProvider
      baseUrl={apiBaseUrl}
      onSessionExpired={async () => {
        const refreshed = await refresh();
        if (!refreshed) {
          toast.show({ variant: 'danger', message: t('auth.errors.sessionExpired') });
          await signOut();
        }
        return refreshed;
      }}
      onForbidden={() => {
        toast.show({ variant: 'danger', message: t('errors.forbidden') });
        // Covers the "permissions changed mid-session" case from the HTTP
        // handling matrix: reconcile the local role/permission set against
        // the server's before treating the denial as final.
        void reloadAuthContext();
      }}
    >
      {children}
    </ApiClientProvider>
  );
}

/** Gates `children` behind auth bootstrap resolving — no protected route renders and no redirect fires while `status === 'unknown'` (AC1, AC3). */
function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'unknown') {
    return <AppSplash />;
  }
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      {/* Locale must be an ancestor of Theme — `ThemeProvider` reads
          `useLocale()` so the applied `--line-height-*` tokens match the
          active locale (see `shared/theme/ThemeProvider.tsx`). */}
      <LocaleWithConfig>
        <ThemeWithConfig>
          <ToastProvider>
            {/* TODO: mount QueryClientProvider when TanStack Query is adopted */}
            <AuthProvider>
              <AuthorizationWithStore>
                <ApiClientWithConfig>
                  <AppShell>{children}</AppShell>
                </ApiClientWithConfig>
              </AuthorizationWithStore>
            </AuthProvider>
          </ToastProvider>
        </ThemeWithConfig>
      </LocaleWithConfig>
    </ConfigProvider>
  );
}
