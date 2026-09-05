import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAppConfig } from '@app/configuration/ConfigProvider';
import { useAppStore } from '@app/store/appStore';
import { HttpClient, isApiError, setAccessToken } from '@shared/api';
import { bumpCacheGeneration } from '@shared/hooks';

import { fetchMe, login, logout, refresh as refreshRequest } from './api';
import type { MeResponse, TokenPairResponse } from './api';
import { refreshBridge } from './refreshBridge';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  // TODO(backend): map emailVerified + locale once /auth/me exposes them;
  // fallback: emailVerified=true, locale=null.
  emailVerified: boolean;
  locale: 'en' | 'ar' | null;
}

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  signIn(input: SignInInput): Promise<void>;
  signOut(): Promise<void>;
  /** Called by `HttpClient.onSessionExpired` — returns true if retry may proceed. */
  refresh(): Promise<boolean>;
  /** Re-fetches `/auth/me` + permissions for the current session; no-op if anonymous. */
  reloadAuthContext(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    fullName: me.full_name,
    email: me.email,
    emailVerified: true,
    locale: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const setSessionInStore = useAppStore((state) => state.setSession);
  const clearSessionInStore = useAppStore((state) => state.clearSession);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<AuthStatus>('unknown');
  // The refresh token is never exposed on the context, in the Zustand store,
  // or in any public API — this ref is a purely internal, tab-local detail
  // AuthProvider needs to call `refresh()`/`signOut()` itself. See
  // `refreshBridge.ts` for the storage-backed copy used across a page
  // reload; per D-01 that bridge is a temporary stand-in for a backend
  // refresh cookie and will be deleted once that lands.
  const refreshTokenRef = useRef<string | undefined>(undefined);
  const rememberMeRef = useRef(false);
  const bootstrapped = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Every `HttpClient` instance reads the current access token from the
  // module-scoped `tokenStore`, not from a constructor-injected callback —
  // so this instance behaves identically to the one `ApiClientProvider`
  // hands to the rest of the app without the two needing to be the same
  // object. That's what breaks the circular dependency: `AuthProvider` sits
  // above `ApiClientProvider` in the tree (see `AppProviders.tsx`) and so
  // cannot call `useApiClient()` itself.
  const client = useMemo(() => new HttpClient({ baseUrl: config.apiBaseUrl }), [config.apiBaseUrl]);

  const applySession = useCallback(
    (tokens: TokenPairResponse, me: MeResponse, nextPermissions: string[]) => {
      setAccessToken(tokens.access_token);
      refreshTokenRef.current = tokens.refresh_token;

      const nextUser = toAuthUser(me);
      const nextRoles = me.roles.map((role) => role.name);
      setUser(nextUser);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
      setStatus('authenticated');
      setSessionInStore({
        user: {
          id: nextUser.id,
          email: nextUser.email,
          fullName: nextUser.fullName,
          roles: nextRoles,
          permissions: nextPermissions,
        },
      });

      // Always write: the mode argument decides whether the token also
      // lands in `localStorage` (survives a browser restart) or stays
      // memory-only for this tab (cleared the moment the tab's JS context
      // ends) — see `refreshBridge.ts`.
      refreshBridge.write(tokens.refresh_token, rememberMeRef.current ? 'persistent' : 'session');
    },
    [setSessionInStore],
  );

  const clearSession = useCallback(
    (options: { broadcast?: boolean } = {}) => {
      setAccessToken(undefined);
      refreshTokenRef.current = undefined;
      rememberMeRef.current = false;
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setStatus('anonymous');
      clearSessionInStore();
      refreshBridge.clear();
      if (options.broadcast) {
        // Only the user's own sign-out broadcasts — a bootstrap/refresh
        // failure clearing an already-anonymous or never-authenticated tab
        // has nothing to tell sibling tabs.
        refreshBridge.broadcastSignOut();
      }
      // No imperative navigation here: `AuthProvider` sits above the router in
      // `AppProviders`, outside `RouterProvider`'s context. Any mounted
      // `<RequireAuth>` reacts to `status` becoming non-authenticated and
      // redirects to `/login` on its own.
    },
    [clearSessionInStore],
  );

  const bootstrapSession = useCallback(
    async (tokens: TokenPairResponse) => {
      // The access token must be in `tokenStore` before `fetchMe`/permission
      // calls go out, since `HttpClient` attaches it automatically now.
      setAccessToken(tokens.access_token);
      const me = await fetchMe(client);
      applySession(tokens, me, me.permissions);
    },
    [client, applySession],
  );

  useEffect(() => {
    // Guards against React 18 StrictMode's dev-only double-invoke of effects.
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;

    const storedRefreshToken = refreshBridge.read();
    if (!storedRefreshToken) {
      setStatus('anonymous');
      return;
    }

    // On a fresh page load the bridge's in-memory tier is always empty, so a
    // non-null read here can only have come from `localStorage` — i.e. a
    // remembered session from a previous visit.
    rememberMeRef.current = true;
    void (async () => {
      try {
        const tokens = await refreshRequest(client, storedRefreshToken);
        await bootstrapSession(tokens);
      } catch (error) {
        // 4xx from refresh = the stored token is truly bad → force anonymous.
        // Network / 5xx = leave `status = 'unknown'` and retry once after 2s.
        //   Prevents a transient offline state from silently logging the user
        //   out between tabs, and satisfies AC1/AC2 (status must not resolve
        //   to 'anonymous' or 'authenticated' before a real answer exists).
        if (isApiError(error) && error.status >= 400 && error.status < 500) {
          clearSession();
        } else {
          setTimeout(() => {
            void (async () => {
              try {
                const retryTokens = await refreshRequest(client, storedRefreshToken);
                await bootstrapSession(retryTokens);
              } catch {
                clearSession();
              }
            })();
          }, 2000);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Multi-tab sign-out (AC16): a sibling tab's sign-out broadcasts via
  // `localStorage`'s `storage` event (never fired in the originating tab
  // itself, only in others sharing the same origin).
  useEffect(
    () =>
      refreshBridge.onSignOutBroadcast(() => {
        if (statusRef.current === 'authenticated') {
          bumpCacheGeneration();
          clearSession();
        }
      }),
    [clearSession],
  );

  // BFCache / back-button hardening (AC15): a `pageshow` with
  // `event.persisted === true` means this tab's JS heap was frozen and is
  // now being resumed as-is — any sign-out that happened on a sibling tab
  // while this one was suspended was never observed. Re-validate against
  // the bridge (and the backend, via a fresh refresh) before trusting the
  // frozen `status`.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        return;
      }
      const storedRefreshToken = refreshBridge.read();
      if (!storedRefreshToken) {
        if (statusRef.current === 'authenticated') {
          clearSession();
        }
        return;
      }
      void (async () => {
        try {
          const tokens = await refreshRequest(client, storedRefreshToken);
          await bootstrapSession(tokens);
        } catch {
          clearSession();
        }
      })();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [client, bootstrapSession, clearSession]);

  const signIn = useCallback(
    async ({ email, password, rememberMe = false }: SignInInput) => {
      rememberMeRef.current = rememberMe;
      const tokens = await login(client, { email, password });
      await bootstrapSession(tokens);
    },
    [client, bootstrapSession],
  );

  const signOut = useCallback(async () => {
    const refreshToken = refreshTokenRef.current ?? refreshBridge.read();
    bumpCacheGeneration();
    try {
      if (refreshToken) {
        await logout(client, refreshToken);
      }
    } catch {
      // Best-effort — the local session is cleared regardless of the server's response.
    }
    clearSession({ broadcast: true });
  }, [client, clearSession]);

  const reloadAuthContext = useCallback(async () => {
    if (status !== 'authenticated') {
      return;
    }
    const me = await fetchMe(client);
    const nextPermissions = me.permissions;
    const nextUser = toAuthUser(me);
    const nextRoles = me.roles.map((role) => role.name);
    setUser(nextUser);
    setRoles(nextRoles);
    setPermissions(nextPermissions);
    setSessionInStore({
      user: {
        id: nextUser.id,
        email: nextUser.email,
        fullName: nextUser.fullName,
        roles: nextRoles,
        permissions: nextPermissions,
      },
    });
  }, [status, client, setSessionInStore]);

  const refresh = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = refreshTokenRef.current ?? refreshBridge.read();
    if (!currentRefreshToken) {
      return false;
    }
    try {
      const tokens = await refreshRequest(client, currentRefreshToken);
      setAccessToken(tokens.access_token);
      refreshTokenRef.current = tokens.refresh_token;
      refreshBridge.write(tokens.refresh_token, rememberMeRef.current ? 'persistent' : 'session');
      return true;
    } catch (error) {
      // Any 4xx means the refresh token itself is invalid/expired/revoked —
      // clear the session. A network/5xx failure leaves the session intact
      // so `HttpClient`'s caller can retry; see the bootstrap effect above
      // for the same discrimination.
      if (isApiError(error) && error.status >= 400 && error.status < 500) {
        clearSession();
      }
      return false;
    }
  }, [client, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      roles,
      permissions,
      signIn,
      signOut,
      refresh,
      reloadAuthContext,
    }),
    [status, user, roles, permissions, signIn, signOut, refresh, reloadAuthContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
