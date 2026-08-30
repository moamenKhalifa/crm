import type { AppStoreState } from './appStore';

export const selectUser = (state: AppStoreState) => state.user;
export const selectAuthStatus = (state: AppStoreState) => state.authStatus;
export const selectRoles = (state: AppStoreState) => state.user?.roles ?? [];
export const selectPermissions = (state: AppStoreState) => state.user?.permissions ?? [];
export const selectLocale = (state: AppStoreState) => state.locale;
export const selectTheme = (state: AppStoreState) => state.themeName;
