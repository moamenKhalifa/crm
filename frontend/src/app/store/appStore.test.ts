import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from './appStore';

const USER = { id: 'u1', email: 'a@b.com', fullName: 'A B', roles: ['agent'], permissions: ['User.View'] };

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.getState().clearSession();
  });

  it('setSession populates the user and marks the session authenticated', () => {
    useAppStore.getState().setSession({ user: USER });

    const state = useAppStore.getState();
    expect(state.authStatus).toBe('authenticated');
    expect(state.user).toEqual(USER);
  });

  it('clearSession wipes the user and marks the session anonymous', () => {
    useAppStore.getState().setSession({ user: USER });
    useAppStore.getState().clearSession();

    const state = useAppStore.getState();
    expect(state.authStatus).toBe('anonymous');
    expect(state.user).toBeNull();
  });
});
