/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PROXY_TARGET: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_AUTH_MODE: string;
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_LOGO_URL: string;
  readonly VITE_BRAND_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
