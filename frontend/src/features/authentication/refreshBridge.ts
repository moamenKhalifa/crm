// TODO(backend-cookies): delete this entire file once /auth/refresh reads
// the HttpOnly refresh cookie set by /auth/login. Until then this bridge
// keeps the current storage-backed flow working without leaking storage
// details into AuthProvider — it also now carries the sign-out broadcast;
// the recommended replacement once cookies land is a `BroadcastChannel`
// (`new BroadcastChannel('crm-auth')`) rather than the `storage` event hack.
const LOCAL_KEY = 'crm.rt';
const BROADCAST_KEY = 'crm.rt.broadcast';

// In-memory copy for the current tab: always the source of truth for
// `read()` within this tab, regardless of remember-me. `write(token,
// 'persistent')` additionally mirrors it to `localStorage` so it survives a
// browser restart; `'session'` (the default) never touches `localStorage`,
// so the session ends when the tab's JS context is torn down.
let memoryToken: string | null = null;

export type RememberMode = 'session' | 'persistent';

export const refreshBridge = {
  read(): string | null {
    if (memoryToken !== null) {
      return memoryToken;
    }
    try {
      return window.localStorage.getItem(LOCAL_KEY);
    } catch {
      return null;
    }
  },
  write(token: string | null, mode: RememberMode = 'session'): void {
    memoryToken = token;
    try {
      if (mode === 'persistent' && token) {
        window.localStorage.setItem(LOCAL_KEY, token);
      } else {
        window.localStorage.removeItem(LOCAL_KEY);
      }
    } catch {
      // Safari private-mode etc. — memory still valid for this tab; remember-me silently degrades to session mode.
    }
  },
  clear(): void {
    memoryToken = null;
    try {
      window.localStorage.removeItem(LOCAL_KEY);
    } catch {
      // ignore
    }
  },
  /** Fires a same-origin sign-out broadcast so sibling tabs clear within 2s (AC16). */
  broadcastSignOut(): void {
    try {
      window.localStorage.setItem(BROADCAST_KEY, String(Date.now()));
      window.localStorage.removeItem(BROADCAST_KEY);
    } catch {
      // ignore — best-effort; the originating tab's own session is still cleared.
    }
  },
  /** Subscribes to sign-out broadcasts from sibling tabs; returns an unsubscribe function. */
  onSignOutBroadcast(handler: () => void): () => void {
    const listener = (event: StorageEvent) => {
      if (event.key === BROADCAST_KEY && event.newValue !== null) {
        handler();
      }
      if (event.key === LOCAL_KEY && event.newValue === null && memoryToken !== null) {
        handler();
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
};

/** Test-only: clears the in-memory token between tests (unlike the old sessionStorage-backed bridge, this state does not reset itself between test cases in the same file). */
export function __resetRefreshBridgeForTests(): void {
  memoryToken = null;
}
