import { describe, expect, it } from 'vitest';

import { parseAppConfig } from './env';

function makeEnv(overrides: Partial<ImportMetaEnv> = {}): ImportMetaEnv {
  return {
    VITE_API_BASE_URL: '/api',
    VITE_API_PROXY_TARGET: 'http://localhost:8000',
    VITE_APP_NAME: 'Customer Support CRM',
    VITE_AUTH_MODE: 'stub',
    VITE_DEFAULT_LOCALE: 'en',
    VITE_LOGO_URL: '',
    VITE_BRAND_NAME: '',
    ...overrides,
  } as ImportMetaEnv;
}

describe('parseAppConfig', () => {
  it('returns a typed config when all variables are present', () => {
    const config = parseAppConfig(makeEnv());

    expect(config).toEqual({
      apiBaseUrl: '/api',
      appName: 'Customer Support CRM',
      authMode: 'stub',
      defaultLocale: 'en',
      logoUrl: undefined,
      brandName: undefined,
    });
  });

  it('throws when VITE_API_BASE_URL is missing', () => {
    const env = makeEnv({ VITE_API_BASE_URL: '' });

    expect(() => parseAppConfig(env)).toThrow('Missing required environment variable: VITE_API_BASE_URL');
  });

  it('throws when VITE_AUTH_MODE is invalid', () => {
    const env = makeEnv({ VITE_AUTH_MODE: 'password' });

    expect(() => parseAppConfig(env)).toThrow(/Invalid VITE_AUTH_MODE/);
  });

  it('defaults VITE_DEFAULT_LOCALE to "en" when absent', () => {
    const env = makeEnv({ VITE_DEFAULT_LOCALE: '' });

    expect(parseAppConfig(env).defaultLocale).toBe('en');
  });

  it('throws when VITE_DEFAULT_LOCALE is invalid', () => {
    const env = makeEnv({ VITE_DEFAULT_LOCALE: 'fr' });

    expect(() => parseAppConfig(env)).toThrow(/Invalid VITE_DEFAULT_LOCALE/);
  });
});
