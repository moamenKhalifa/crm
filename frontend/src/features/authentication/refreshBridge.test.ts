import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshBridge } from './refreshBridge';

describe('refreshBridge', () => {
  beforeEach(() => {
    window.localStorage.clear();
    refreshBridge.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    refreshBridge.clear();
  });

  it('write(token, "persistent") persists to localStorage and read() returns it', () => {
    refreshBridge.write('rt-1', 'persistent');
    expect(window.localStorage.getItem('crm.rt')).toBe('rt-1');
    expect(refreshBridge.read()).toBe('rt-1');
  });

  it('write(token, "session") (default) never touches localStorage but read() still returns the in-memory token', () => {
    refreshBridge.write('rt-2');
    expect(window.localStorage.getItem('crm.rt')).toBeNull();
    expect(refreshBridge.read()).toBe('rt-2');
  });

  it('clear() wipes both the in-memory token and localStorage', () => {
    refreshBridge.write('rt-3', 'persistent');
    refreshBridge.clear();
    expect(refreshBridge.read()).toBeNull();
    expect(window.localStorage.getItem('crm.rt')).toBeNull();
  });

  it('broadcastSignOut sets then immediately clears the broadcast key', () => {
    const setSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');
    refreshBridge.broadcastSignOut();
    expect(setSpy).toHaveBeenCalledWith('crm.rt.broadcast', expect.any(String));
    expect(window.localStorage.getItem('crm.rt.broadcast')).toBeNull();
    setSpy.mockRestore();
  });

  it('onSignOutBroadcast fires the handler on a broadcast-key storage event and can unsubscribe', () => {
    const handler = vi.fn();
    const unsubscribe = refreshBridge.onSignOutBroadcast(handler);

    window.dispatchEvent(new StorageEvent('storage', { key: 'crm.rt.broadcast', newValue: '123' }));
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: 'crm.rt.broadcast', newValue: '456' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('onSignOutBroadcast also fires when the local token key is removed while memory still holds one', () => {
    refreshBridge.write('rt-4', 'persistent');
    const handler = vi.fn();
    refreshBridge.onSignOutBroadcast(handler);

    window.dispatchEvent(new StorageEvent('storage', { key: 'crm.rt', newValue: null }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('degrades to memory-only when localStorage.setItem throws (Safari private mode)', () => {
    const setSpy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => refreshBridge.write('rt-5', 'persistent')).not.toThrow();
    expect(refreshBridge.read()).toBe('rt-5');

    setSpy.mockRestore();
  });
});
