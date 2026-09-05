import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

import { __resetTokenStoreForTests } from '@shared/api/tokenStore';
import { __resetRefreshBridgeForTests } from '@features/authentication/refreshBridge';

expect.extend(toHaveNoViolations);

// jsdom does not implement `window.matchMedia` at all. `ThemeProvider`
// already tolerates that (its `prefers-color-scheme` check is wrapped in a
// try/catch, falling back to `false`), but `useBreakpoint()` calls it
// directly and has no such guard — every test that renders a component
// using `useBreakpoint()` (namely `DataTable`) would otherwise crash with
// "window.matchMedia is not a function". Polyfill a default here: `true`
// for `min-width` queries (so components default to the "wide" bucket,
// matching a real desktop test viewport) and `false` for everything else
// (preserving the pre-existing "light theme" default `prefersDark()` relied
// on when `matchMedia` was simply undefined). Tests that need a specific
// breakpoint still override this per-file via `vi.stubGlobal('matchMedia', ...)`
// (see `useBreakpoint.test.tsx`) — `vi.unstubAllGlobals()` correctly restores
// this default afterwards since it's a plain assignment, not a stub itself.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) =>
    ({
      matches: /min-width/.test(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

// `app/configuration/env.ts` builds `appConfig` eagerly at import time (so
// consumers get a plain typed object, not a hook), which requires the
// VITE_* vars to already be set. No .env file exists in the test run, so
// seed safe defaults here before any test file imports that module.
// `Object.assign` (not `||=`) because `ImportMetaEnv` fields are `readonly`.
Object.assign(import.meta.env, {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Customer Support CRM',
  VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE || 'stub',
});

afterEach(() => {
  cleanup();
  __resetTokenStoreForTests();
  __resetRefreshBridgeForTests();
});
