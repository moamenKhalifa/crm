import type { ReactNode } from 'react';

import { KeyIcon, ShieldIcon, UsersIcon } from '@shared/components/icons';
import type { AppSidebarGroup } from '@shared/components';

/**
 * Mirrors the `permission`-gated routes under `/admin` in
 * `frontend/src/app/routing/AppRouter.tsx` (`Protected permission="…"`
 * wrapping `users/*`, `roles/*`, `permissions/*`). Kept as a small,
 * independently-readable list — rather than threading a shared constant
 * through `AppRouter.tsx`'s route JSX — so this file stays the single place
 * that turns "what routes exist" into "what the sidebar shows" (AC2).
 * `shellNavigation.test.ts` asserts this list still matches `AppRouter.tsx`.
 */
export interface AdminRouteGuard {
  key: string;
  labelKey: string;
  to: string;
  permission: string;
}

export const ADMIN_ROUTE_GUARDS: AdminRouteGuard[] = [
  { key: 'users', labelKey: 'admin.nav.users', to: '/admin/users', permission: 'User.View' },
  { key: 'roles', labelKey: 'admin.nav.roles', to: '/admin/roles', permission: 'Role.View' },
  { key: 'permissions', labelKey: 'admin.nav.permissions', to: '/admin/permissions', permission: 'Permission.View' },
];

const ADMIN_ICONS: Record<string, ReactNode> = {
  users: <UsersIcon />,
  roles: <ShieldIcon />,
  permissions: <KeyIcon />,
};

/** Builds the sidebar's `AppSidebarGroup[]` for the authenticated shell. `t` resolves every label (G8). */
export function buildShellNavigation(t: (key: string) => string): AppSidebarGroup[] {
  return [
    {
      key: 'administration',
      label: t('nav.sidebar.groups.administration'),
      items: ADMIN_ROUTE_GUARDS.map((guard) => ({
        key: guard.key,
        label: t(guard.labelKey),
        icon: ADMIN_ICONS[guard.key],
        to: guard.to,
        permission: guard.permission,
      })),
    },
  ];
}
