import { describe, expect, it } from 'vitest';

import { __resetTokenStoreForTests, getAccessToken, setAccessToken, subscribeAccessToken } from './tokenStore';

describe('tokenStore', () => {
  it('getAccessToken returns undefined after reset', () => {
    setAccessToken('a-token');
    __resetTokenStoreForTests();
    expect(getAccessToken()).toBeUndefined();
  });

  it('setAccessToken notifies subscribers exactly once with the new token', () => {
    const calls: Array<string | undefined> = [];
    const unsubscribe = subscribeAccessToken((token) => calls.push(token));

    setAccessToken('a-token');

    expect(calls).toEqual(['a-token']);
    expect(getAccessToken()).toBe('a-token');
    unsubscribe();
  });

  it('__resetTokenStoreForTests clears listeners', () => {
    const calls: Array<string | undefined> = [];
    subscribeAccessToken((token) => calls.push(token));

    __resetTokenStoreForTests();
    setAccessToken('after-reset');

    expect(calls).toEqual([]);
  });
});
