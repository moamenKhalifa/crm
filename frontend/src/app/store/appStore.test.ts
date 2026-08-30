import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from './appStore';

const USER = { id: 'u1', email: 'a@b.com', fullName: 'A B', roles: ['agent'], permissions: ['User.View'] };

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.getState().clearSession();
  });

  it('setSession populates user and tokens', () => {
    useAppStore.getState().setSession({ user: USER, accessToken: 'a1', refreshToken: 'r1' });

    const state = useAppStore.getState();
    expect(state.authStatus).toBe('authenticated');
    expect(state.user).toEqual(USER);
    expect(state.accessToken).toBe('a1');
    expect(state.refreshToken).toBe('r1');
  });

  it('clearSession wipes user and tokens', () => {
    useAppStore.getState().setSession({ user: USER, accessToken: 'a1', refreshToken: 'r1' });
    useAppStore.getState().clearSession();

    const state = useAppStore.getState();
    expect(state.authStatus).toBe('anonymous');
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('setTokens updates only the tokens', () => {
    useAppStore.getState().setSession({ user: USER, accessToken: 'a1', refreshToken: 'r1' });
    useAppStore.getState().setTokens({ accessToken: 'a2', refreshToken: 'r2' });

    const state = useAppStore.getState();
    expect(state.accessToken).toBe('a2');
    expect(state.refreshToken).toBe('r2');
    expect(state.user).toEqual(USER);
  });
});
