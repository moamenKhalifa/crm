import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

describe('useUnsavedChangesGuard', () => {
  it('attaches a beforeunload listener while dirty and detaches it once clean', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { rerender, unmount } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty), {
      initialProps: { dirty: true },
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    rerender({ dirty: false });
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('does not throw outside a data router — falls back to beforeunload only', () => {
    expect(() =>
      renderHook(() => useUnsavedChangesGuard(true), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      }),
    ).not.toThrow();
  });
});
