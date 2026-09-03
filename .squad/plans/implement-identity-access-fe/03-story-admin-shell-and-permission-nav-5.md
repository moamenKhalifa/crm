# Story 03 — Admin shell, permission-gated navigation, `/forbidden` page (Story: 5)

## Prerequisites

- [Story 02](./02-story-logout-and-persistence-5.md) completed — the authenticated header + persistence exist.

---

## Story Goal

Establish the routing shell and the reusable navigation primitives that Stories 04, 05, and 06 will plug into. Deliverables:

1. Nested `admin` sub-routes (`/admin`, `/admin/users`, `/admin/roles`, `/admin/permissions`) with lazy-loaded shells (page bodies are placeholders here; each subsequent story fills its own).
2. Left-hand admin sidebar (`AppSidebar` — already exists at `frontend/src/shared/components/navigation/AppSidebar.tsx`) with permission-gated items.
3. `/forbidden` page + `RequireAuth` redirects to it (instead of `/`) when an authenticated user hits a route they lack the role/permission for. Covers AC-14.
4. A single reusable `useApiData<T>` hook (list + retry + error → toast) used by the three CRUD stories, so those stories don't each reinvent the loading/error scaffolding. Sit it in `frontend/src/shared/hooks/`.

Out of scope: any actual CRUD (Stories 04–06).

---

## Context — Read These Files First

1. `frontend/src/app/routing/AppRouter.tsx` — read all 67 lines; add nested routes here.
2. `frontend/src/shared/authorization/RequireAuth.tsx` — read all 59 lines; change the "not authorized" branch to redirect to `/forbidden` instead of `/`.
3. `frontend/src/shared/authorization/RequireAuth.test.tsx` — update the "missing role" case.
4. `frontend/src/shared/components/navigation/AppSidebar.tsx` — `AppSidebarProps` and `AppSidebarItem` (grep first).
5. `frontend/src/shared/authorization/PermissionGate.tsx` — reuse to filter sidebar items.
6. `frontend/src/shared/hooks/useAsync.ts` — existing hook, template the new `useApiData` on this style.
7. `frontend/src/shared/api/ApiClientProvider.tsx` — `useApiClient()` to consume the HTTP client.
8. `frontend/src/shared/components/feedback/{LoadingState,ErrorState,EmptyState}.tsx` — the states composed inside `useApiData`'s render helper.

The full list of permissions gating the admin routes comes from `backend/app/modules/identity_access/api/routers/{users,roles,permissions}.py`:

| Route | Route-level permission |
| --- | --- |
| `/admin` | `role: 'admin'` (already enforced by parent `<Protected role="admin">`, see `AppRouter.tsx` line 39) |
| `/admin/users` | `User.View` |
| `/admin/roles` | `Role.View` |
| `/admin/permissions` | `Permission.View` |

---

## Implementation tasks

### 1 — Nested admin routing

File: `frontend/src/app/routing/AppRouter.tsx`

Replace the current `/admin/*` element with an outlet-based tree. Because `createBrowserRouter` supports nested `children`, prefer:

```tsx
{
  path: '/admin',
  element: <Protected role="admin"><AdminArea /></Protected>,
  children: [
    { index: true, element: <Navigate to="users" replace /> },
    { path: 'users/*', element: <Protected permission="User.View"><UserAdminRoutes /></Protected> },
    { path: 'roles/*', element: <Protected permission="Role.View"><RoleAdminRoutes /></Protected> },
    { path: 'permissions/*', element: <Protected permission="Permission.View"><PermissionAdminRoutes /></Protected> },
  ],
},
{ path: '/forbidden', element: <ForbiddenPage /> },
```

`UserAdminRoutes`, `RoleAdminRoutes`, `PermissionAdminRoutes` are `lazy(() => import('@features/identity/users/UserRoutes'))` etc. — create empty modules that export a default component rendering `<Outlet />` for now (each subsequent story will register its own sub-routes there).

`AdminArea.tsx` — replace its body with `<AuthenticatedShell><AdminLayout>{ <Outlet /> }</AdminLayout></AuthenticatedShell>`.

### 2 — Admin layout with permission-gated sidebar

Create file: `frontend/src/features/admin/AdminLayout.tsx`

- Uses `AppSidebar` (grep for `AppSidebarItem` in `frontend/src/shared/components/navigation/AppSidebar.tsx` to see the exact prop shape).
- Item list built from a static array, each entry with a `permission` code; filter with `useAuthorization().hasPermission` **before** rendering. Do not rely on `<PermissionGate>` per-item — the sidebar primitive expects a flat items array (verify by reading it).

```tsx
const items = [
  { to: '/admin/users', label: t('admin.nav.users'), permission: 'User.View' },
  { to: '/admin/roles', label: t('admin.nav.roles'), permission: 'Role.View' },
  { to: '/admin/permissions', label: t('admin.nav.permissions'), permission: 'Permission.View' },
];
```

### 3 — `/forbidden` page

Create file: `frontend/src/shared/components/ForbiddenPage.tsx`

Small page: heading `t('errors.forbiddenTitle')` + body `t('errors.forbidden')` + a `<Button>` back to `/`. Export from `frontend/src/shared/components/index.ts`.

File: `frontend/src/shared/authorization/RequireAuth.tsx`

Change line 55 default from `'/'` to `'/forbidden'`. Keep the `redirectTo` prop so callers may still override (e.g. the sidebar-level check may want a soft redirect back to `/`).

Update `frontend/src/shared/authorization/RequireAuth.test.tsx` case at line 45–48 to expect the Forbidden page instead of Home; add a Forbidden route to the memory router.

### 4 — Shared `useApiData` hook

Create file: `frontend/src/shared/hooks/useApiData.ts`

```ts
export interface UseApiDataOptions<T> {
  fetch(client: HttpClient): Promise<T>;
  deps?: unknown[];
}

export interface UseApiDataResult<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  reload(): void;
}

export function useApiData<T>({ fetch, deps = [] }: UseApiDataOptions<T>): UseApiDataResult<T> { ... }
```

- Reads `useApiClient()`.
- Uses `useEffect` + an abort-style guard (mounted ref, like `useForm`) to prevent state updates after unmount.
- On the initial fetch and after `reload()`, sets `isLoading`, awaits `fetch(client)`, stores `data`, catches into `error`. **Do not** push a toast here — leave that to callers (Stories 04–06 use `useToast()` themselves when they need to).
- Export from `frontend/src/shared/hooks/index.ts`.

Also create a render helper `frontend/src/shared/components/feedback/AsyncBoundary.tsx`:

```tsx
export function AsyncBoundary<T>({ query, empty, children }: { query: UseApiDataResult<T>; empty?: ReactNode; children(data: T): ReactNode }) {
  if (query.isLoading) return <LoadingState />;
  if (query.error) return <ErrorState onRetry={query.reload} messageKey={toUserMessage(query.error, ...)} />;
  if (empty && (query.data === undefined || (Array.isArray(query.data) && query.data.length === 0))) return <>{empty}</>;
  return <>{children(query.data as T)}</>;
}
```

(Use the existing `toUserMessage` from `frontend/src/shared/errors/toUserMessage.ts`.)

### 5 — i18n

File: `frontend/src/shared/i18n/locales/en/common.json` — add:

```json
"admin": {
  "nav": {
    "users": "Users",
    "roles": "Roles",
    "permissions": "Permissions"
  }
},
"errors": {
  ...,
  "forbiddenTitle": "Access denied",
  "backHome": "Back to home"
}
```

Mirror in the `ar` locale file.

---

## Edge Cases & Failure Modes

- **User has `admin` role but no `User.View`** — `/admin` renders (guarded by role), but the sidebar hides the Users link; if they type `/admin/users` directly, the nested `<Protected permission="User.View">` redirects them to `/forbidden`. Cover with a `RequireAuth` test.
- **Zero permissions, `authenticated`** — sidebar renders empty; hitting `/admin` bounces to `/forbidden`.
- **`useApiData` mid-flight, deps change** — the mounted-ref guard prevents stale writes.
- **Repeated `reload()` clicks** — the effect creates a new `Promise` each time; the mounted guard is enough because we never look at the previous promise result.
- **RTL sidebar** — `AppSidebar` is already RTL-aware; no changes needed.

### Post-implementation fix — React StrictMode `mounted`-ref bug

Live browser testing (not the mocked test suite — Testing Library's `render` doesn't use `StrictMode`, so this was invisible to it) surfaced a real bug in the mounted-ref guard referenced above: `const mounted = useRef(true)` is only set once, but React 18 `StrictMode`'s dev-only mount→cleanup→remount cycle runs the cleanup (`mounted.current = false`) during the synthetic unmount and never resets it on the synthetic remount. Every fetch that resolved afterward was silently dropped, leaving the UI stuck on "Loading…" forever even though the request had actually succeeded. Fixed in `useApiData.ts` by moving `mounted.current = true` into the effect body itself, so it resets on every real mount. The identical pattern pre-existed in `useForm` and `useAsync` (not introduced by this story, but sharing the same bug) and was fixed the same way — since `useForm` backs nearly every form in the app, this also fixes submit buttons/error messages getting stuck after a StrictMode remount.

---

## Test Plan

1. **Unit — `frontend/src/shared/hooks/useApiData.test.ts`** (new): success, failure, `reload()` re-fetches, unmount does not set state.
2. **Component — `frontend/src/shared/components/feedback/AsyncBoundary.test.tsx`** (new): loading/error/empty/data branches.
3. **Component — `frontend/src/features/admin/AdminLayout.test.tsx`** (new): sidebar items visible/hidden according to `AuthorizationProvider` fixture.
4. **Routing — `frontend/src/app/routing/AppRouter.test.tsx`**: extend for
   - Direct navigation to `/admin/users` while missing `User.View` bounces to `/forbidden`.
   - `/admin` redirects to `/admin/users` when the user has `User.View`.
5. **Unit — `RequireAuth.test.tsx`**: the "missing role" case now redirects to `/forbidden` (updated).

---

## Verification Steps

1. **Frontend tests:** `pnpm test` in `frontend/`.
2. **Frontend builds:** `pnpm build` in `frontend/`.
3. **Manual smoke:** sign in as the seeded admin (see `backend/app/modules/identity_access/infrastructure/seed.py`), navigate to `/admin`, expect redirect to `/admin/users` and the three sidebar items. Sign in as an agent, expect `/admin` to bounce to `/forbidden`.

---

## Done Criteria

- [ ] `/admin` shell with nested `users`/`roles`/`permissions` sub-routes exists (bodies are placeholders).
- [ ] Sidebar items appear only for users with the matching `*.View` permission.
- [ ] `/forbidden` renders and `RequireAuth` sends unauthorized users there.
- [ ] `useApiData` + `AsyncBoundary` published from `@shared/hooks` / `@shared/components`.
- [ ] `pnpm test` + `pnpm build` pass.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 04.**
