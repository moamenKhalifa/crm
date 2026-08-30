import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useApiClient } from './ApiClientProvider';

describe('useApiClient', () => {
  it('throws when used outside ApiClientProvider', () => {
    expect(() => renderHook(() => useApiClient())).toThrow(
      'useApiClient must be used within ApiClientProvider',
    );
  });
});
