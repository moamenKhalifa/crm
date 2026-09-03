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
  locale: 'en' | 'ar';
  themeName: 'light' | 'dark';

  setSession(input: { user: StoreUser }): void;
  clearSession(): void;
  setLocale(locale: 'en' | 'ar'): void;
  setTheme(theme: 'light' | 'dark'): void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  authStatus: 'unknown',
  user: null,
  locale: 'en',
  themeName: 'light',

  setSession: ({ user }) => set({ authStatus: 'authenticated', user }),

  clearSession: () => set({ authStatus: 'anonymous', user: null }),

  setLocale: (locale) => set({ locale }),

  setTheme: (themeName) => set({ themeName }),
}));
