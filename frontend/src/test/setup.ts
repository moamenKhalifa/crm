import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

import { __resetTokenStoreForTests } from '@shared/api/tokenStore';
import { __resetRefreshBridgeForTests } from '@features/authentication/refreshBridge';

expect.extend(toHaveNoViolations);

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
