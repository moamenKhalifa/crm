export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  authMode: 'stub' | 'oidc';
  defaultLocale: 'en' | 'ar';
  logoUrl?: string;
  brandName?: string;
}

const VALID_AUTH_MODES = new Set<AppConfig['authMode']>(['stub', 'oidc']);
const VALID_LOCALES = new Set<AppConfig['defaultLocale']>(['en', 'ar']);

function readRequired(env: ImportMetaEnv, key: keyof ImportMetaEnv): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function parseAppConfig(env: ImportMetaEnv): AppConfig {
  const apiBaseUrl = readRequired(env, 'VITE_API_BASE_URL');
  const appName = env.VITE_APP_NAME || 'Customer Support CRM';
  const authModeRaw = env.VITE_AUTH_MODE || 'stub';
  const defaultLocaleRaw = env.VITE_DEFAULT_LOCALE || 'en';

  if (!VALID_AUTH_MODES.has(authModeRaw as AppConfig['authMode'])) {
    throw new Error(
      `Invalid VITE_AUTH_MODE: "${authModeRaw}". Expected one of: ${Array.from(VALID_AUTH_MODES).join(', ')}`,
    );
  }

  if (!VALID_LOCALES.has(defaultLocaleRaw as AppConfig['defaultLocale'])) {
    throw new Error(
      `Invalid VITE_DEFAULT_LOCALE: "${defaultLocaleRaw}". Expected one of: ${Array.from(VALID_LOCALES).join(', ')}`,
    );
  }

  return Object.freeze({
    apiBaseUrl,
    appName,
    authMode: authModeRaw as AppConfig['authMode'],
    defaultLocale: defaultLocaleRaw as AppConfig['defaultLocale'],
    logoUrl: env.VITE_LOGO_URL || undefined,
    brandName: env.VITE_BRAND_NAME || undefined,
  });
}

export const appConfig: AppConfig = parseAppConfig(import.meta.env);
