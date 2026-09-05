import { describe, expect, it } from 'vitest';

import { ADMIN_ROUTE_GUARDS, buildShellNavigation } from './shellNavigation';

// Mirrors the `Protected permission="…"` routes actually declared under
// `/admin` in `frontend/src/app/routing/AppRouter.tsx` — a permission-gated
// route with no corresponding sidebar entry (or vice versa) means this list
// has drifted from the router and must be updated in the same commit (AC2).
const EXPECTED_ADMIN_ROUTES = [
  { to: '/admin/users', permission: 'User.View' },
  { to: '/admin/roles', permission: 'Role.View' },
  { to: '/admin/permissions', permission: 'Permission.View' },
];

describe('shellNavigation', () => {
  it('ADMIN_ROUTE_GUARDS matches the permission-gated routes declared in AppRouter.tsx', () => {
    const actual = ADMIN_ROUTE_GUARDS.map(({ to, permission }) => ({ to, permission }));
    expect(actual).toEqual(EXPECTED_ADMIN_ROUTES);
  });

  it('buildShellNavigation produces one item per guard, each carrying an icon', () => {
    const groups = buildShellNavigation((key) => key);

    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(ADMIN_ROUTE_GUARDS.length);
    for (const item of groups[0].items) {
      expect(item.icon).toBeTruthy();
    }
  });

  it('every item carries the matching to/permission from its guard', () => {
    const groups = buildShellNavigation((key) => key);
    const items = groups[0].items;

    for (const guard of ADMIN_ROUTE_GUARDS) {
      const item = items.find((candidate) => candidate.key === guard.key);
      expect(item).toBeDefined();
      expect(item?.to).toBe(guard.to);
      expect(item?.permission).toBe(guard.permission);
    }
  });
});
