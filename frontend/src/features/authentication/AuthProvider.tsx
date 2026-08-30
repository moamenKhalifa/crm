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
import { HttpClient, isApiError } from '@shared/api';

import { fetchMe, fetchPermissionsForRoles, login, logout, refresh as refreshRequest } from './api';
import type { TokenPairResponse, UserResponse } from './api';

export type Role = string;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  signIn(input: SignInInput): Promise<void>;
  signOut(): Promise<void>;
  getAccessToken(): string | undefined;
  /** Used by `ApiClientProvider`'s `onUnauthorized` — returns `true` if the retry should proceed. */
  refresh(): Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REFRESH_TOKEN_STORAGE_KEY = 'crm.rt';

function readStoredRefreshToken(): string | null {
  try {
    return window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredRefreshToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage disabled (e.g. Safari private mode) — session still works in-memory for this tab.
  }
}

function toAuthUser(me: UserResponse, permissions: string[]): AuthUser {
  return {
    id: me.id,
    email: me.email,
    fullName: me.full_name,
    roles: me.roles.map((role) => role.name),
    permissions,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const setSessionInStore = useAppStore((state) => state.setSession);
  const clearSessionInStore = useAppStore((state) => state.clearSession);
  const setTokensInStore = useAppStore((state) => state.setTokens);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const accessTokenRef = useRef<string | undefined>(undefined);
  const refreshTokenRef = useRef<string | undefined>(undefined);
  const rememberMeRef = useRef(false);
  const bootstrapped = useRef(false);

  // Login/refresh are public endpoints and logout/me carry their own Bearer
  // header explicitly (see api.ts) — a private client sidesteps a circular
  // dependency: `ApiClientProvider` (below this in AppProviders) needs
  // `getAccessToken`/`refresh` FROM this provider, so this provider cannot
  // itself depend on `useApiClient()`.
  const authClient = useMemo(() => new HttpClient({ baseUrl: config.apiBaseUrl }), [config.apiBaseUrl]);

  const applySession = useCallback(
    (tokens: TokenPairResponse, me: UserResponse, permissions: string[]) => {
      accessTokenRef.current = tokens.access_token;
      refreshTokenRef.current = tokens.refresh_token;

      const nextUser = toAuthUser(me, permissions);
      setUser(nextUser);
      setStatus('authenticated');
      setSessionInStore({
        user: nextUser,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      if (rememberMeRef.current) {
        writeStoredRefreshToken(tokens.refresh_token);
      }
    },
    [setSessionInStore],
  );

  const clearSession = useCallback(() => {
    accessTokenRef.current = undefined;
    refreshTokenRef.current = undefined;
    rememberMeRef.current = false;
    setUser(null);
    setStatus('anonymous');
    clearSessionInStore();
    writeStoredRefreshToken(null);
    // No imperative navigation here: `AuthProvider` sits above the router in
    // `AppProviders`, outside `RouterProvider`'s context. Any mounted
    // `<RequireAuth>` reacts to `status` becoming non-authenticated and
    // redirects to `/sign-in` on its own.
  }, [clearSessionInStore]);

  const bootstrapSession = useCallback(
    async (tokens: TokenPairResponse) => {
      const me = await fetchMe(authClient, tokens.access_token);
      const roleIds = me.roles.map((role) => role.id);
      const permissions = await fetchPermissionsForRoles(authClient, tokens.access_token, roleIds);
      applySession(tokens, me, permissions);
    },
    [authClient, applySession],
  );

  useEffect(() => {
    // Guards against React 18 StrictMode's dev-only double-invoke of effects.
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;

    const storedRefreshToken = readStoredRefreshToken();
    if (!storedRefreshToken) {
      setStatus('anonymous');
      return;
    }

    rememberMeRef.current = true;
    void (async () => {
      try {
        const tokens = await refreshRequest(authClient, storedRefreshToken);
        await bootstrapSession(tokens);
      } catch {
        clearSession();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(
    async ({ email, password, rememberMe = false }: SignInInput) => {
      rememberMeRef.current = rememberMe;
      const tokens = await login(authClient, { email, password });
      await bootstrapSession(tokens);
    },
    [authClient, bootstrapSession],
  );

  const signOut = useCallback(async () => {
    const currentRefreshToken = refreshTokenRef.current;
    const currentAccessToken = accessTokenRef.current;
    if (currentRefreshToken && currentAccessToken) {
      try {
        await logout(authClient, currentRefreshToken, currentAccessToken);
      } catch {
        // Best-effort — the local session is cleared regardless of the server's response.
      }
    }
    clearSession();
  }, [authClient, clearSession]);

  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = refreshTokenRef.current;
    if (!currentRefreshToken) {
      return false;
    }
    try {
      const tokens = await refreshRequest(authClient, currentRefreshToken);
      accessTokenRef.current = tokens.access_token;
      refreshTokenRef.current = tokens.refresh_token;
      setTokensInStore({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      if (rememberMeRef.current) {
        writeStoredRefreshToken(tokens.refresh_token);
      }
      return true;
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearSession();
      }
      return false;
    }
  }, [authClient, setTokensInStore, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      signIn,
      signOut,
      getAccessToken,
      refresh,
    }),
    [user, status, signIn, signOut, getAccessToken, refresh],
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
