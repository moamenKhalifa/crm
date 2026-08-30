import { create } from 'zustand';

export interface StoreUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';

export interface AppStoreState {
  authStatus: AuthStatus;
  user: StoreUser | null;
  /** Never persisted to `localStorage` — see `frontend/docs/architecture.md` §Authentication. */
  accessToken: string | null;
  /** In-memory by default; mirrored to `sessionStorage` only on explicit `rememberMe`. */
  refreshToken: string | null;
  locale: 'en' | 'ar';
  themeName: 'light' | 'dark';

  setSession(input: { user: StoreUser; accessToken: string; refreshToken: string }): void;
  clearSession(): void;
  setTokens(input: { accessToken: string; refreshToken: string }): void;
  setLocale(locale: 'en' | 'ar'): void;
  setTheme(theme: 'light' | 'dark'): void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  authStatus: 'unknown',
  user: null,
  accessToken: null,
  refreshToken: null,
  locale: 'en',
  themeName: 'light',

  setSession: ({ user, accessToken, refreshToken }) =>
    set({ authStatus: 'authenticated', user, accessToken, refreshToken }),

  clearSession: () =>
    set({ authStatus: 'anonymous', user: null, accessToken: null, refreshToken: null }),

  setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),

  setLocale: (locale) => set({ locale }),

  setTheme: (themeName) => set({ themeName }),
}));
