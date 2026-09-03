# Story 04 — User management (Story: 5)

## Prerequisites

- [Story 03](./03-story-admin-shell-and-permission-nav-5.md) completed — admin shell, sidebar, `useApiData`, `AsyncBoundary`, and `/admin/users/*` outlet are in place.

---

## Story Goal

Implement the full **User management** admin experience under `/admin/users`, wired to the backend routes in `backend/app/modules/identity_access/api/routers/users.py` (lines 44–150). Screens:

- **List** (`/admin/users`) — `<Table>` with **Full name**, **Email**, **Active** status, **Roles** (badges), **Actions**. Pagination via `?limit=&offset=`. Actions gated by `User.Create` / `User.Update` / `User.Delete` / `User.AssignRole`.
- **Details** (`/admin/users/:id`) — read-only overview + inline sections for **Roles** with assign/remove and **Activate / Deactivate** toggle.
- **Create** (`/admin/users/new`) — modal or dedicated page (choose page for parity with other admin CRUDs), fields `email`, `password`, `full_name`, `is_customer` (checkbox), `role_ids` (multi-select).
- **Edit** (`/admin/users/:id/edit`) — `email` and `full_name` only (matches `UpdateUserRequest` at `backend/app/modules/identity_access/api/schemas/user.py` lines 27–29).
- **Role assignment** — a dedicated modal launched from Details, uses `PUT /users/{user_id}/roles`.
- **Delete** — `<ConfirmDialog>` from Details or the list row's kebab menu.

The full effective permission set must be re-hydrated for the currently-authenticated admin when they edit **their own** roles (so their sidebar/permissions update in real time). Do this by re-running `AuthProvider.bootstrapSession`-style refresh — expose a `reloadIdentity(): Promise<void>` on `AuthContextValue` (adds ~10 lines to `AuthProvider.tsx`).

Out of scope: bulk operations, CSV import/export, user search UI beyond a single free-text field (backend does not yet expose search — see comment on out-of-scope below).

---

## Context — Read These Files First

1. `backend/app/modules/identity_access/api/routers/users.py` — every endpoint, permission, and status code. Lines 44 (`GET /users`), 53 (`POST /users`), 79 (`GET /users/{id}`), 88 (`PATCH /users/{id}`), 101 (`PATCH /users/{id}/active`), 114 (`DELETE /users/{id}`), 125 (`PUT /users/{id}/roles`), 140 (`GET /users/{id}/roles`).
2. `backend/app/modules/identity_access/api/schemas/user.py` — DTOs and validation constraints. Note `CreateUserRequest.password` `min_length=8, max_length=128`.
3. `backend/app/modules/identity_access/api/schemas/role.py` — `RoleSummaryResponse` used by the roles list on the assignment modal.
4. `frontend/src/features/authentication/api.ts` — existing `UserResponse`/`RoleSummaryResponse` types; **reuse** them (do not duplicate).
5. `frontend/src/shared/authorization/PermissionGate.tsx` — for the row-level action gating.
6. `frontend/src/shared/hooks/useApiData.ts` (created in Story 03) — the fetch primitive.
7. `frontend/src/shared/components/data/Table.tsx` and `Pagination.tsx` — the shared table + paginator.
8. `frontend/src/shared/components/overlay/{Modal,ConfirmDialog}.tsx` — for the assign-roles modal and delete confirm.
9. `frontend/src/shared/components/feedback/ToastProvider.tsx` — for success feedback after mutations.
10. `frontend/src/shared/validation/schemas.ts` — reuse `emailSchema`, `passwordSchema`, `nonEmptyStringSchema`.
11. `frontend/src/features/authentication/AuthProvider.tsx` lines 137–170 — the bootstrap flow you will re-use to implement `reloadIdentity`.

---

## Implementation tasks

Directory layout (all new files):

```
frontend/src/features/identity/
├── users/
│   ├── UserRoutes.tsx          # <Routes> with list / detail / create / edit
│   ├── api.ts                  # module-scoped API functions
│   ├── UserListPage.tsx
│   ├── UserDetailsPage.tsx
│   ├── UserCreatePage.tsx
│   ├── UserEditPage.tsx
│   ├── UserRoleAssignModal.tsx
│   ├── UserActivationToggle.tsx
│   └── *.test.tsx (one per component)
└── types.ts                    # shared display types across identity CRUDs
```

Replace the placeholder `UserRoutes` shim created in Story 03 with the real component.

### 1 — API layer

File: `frontend/src/features/identity/users/api.ts`

Export typed functions for every backend endpoint. Use `HttpClient` from `@shared/api`.

```ts
import type { HttpClient } from '@shared/api';
import type { RoleSummaryResponse, UserResponse } from '@features/authentication/api';

export interface ListUsersParams { limit: number; offset: number }
export function listUsers(client: HttpClient, params: ListUsersParams) {
  const search = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  return client.get<UserResponse[]>(`/users?${search.toString()}`);
}
export function getUser(client: HttpClient, id: string) { return client.get<UserResponse>(`/users/${id}`); }
export function createUser(client: HttpClient, body: { email: string; password: string; full_name: string; is_customer: boolean; role_ids: string[] }) { return client.post<UserResponse>('/users', body); }
export function updateUser(client: HttpClient, id: string, body: { email?: string; full_name?: string }) { return client.request<UserResponse>(`/users/${id}`, { method: 'PATCH', body }); }
export function setUserActive(client: HttpClient, id: string, isActive: boolean) { return client.request<UserResponse>(`/users/${id}/active`, { method: 'PATCH', body: { is_active: isActive } }); }
export function deleteUser(client: HttpClient, id: string) { return client.request<void>(`/users/${id}`, { method: 'DELETE' }); }
export function assignRoles(client: HttpClient, id: string, roleIds: string[]) { return client.request<UserResponse>(`/users/${id}/roles`, { method: 'PUT', body: { role_ids: roleIds } }); }
export function getUserRoles(client: HttpClient, id: string) { return client.get<RoleSummaryResponse[]>(`/users/${id}/roles`); }
```

**Note**: `HttpClient` currently only exposes `get`/`post` (see `frontend/src/shared/api/httpClient.ts` lines 115–121). Add `put`/`patch`/`delete` sugar methods to the `HttpClient` class in this story — matching the same signature as `post` for `put`/`patch`, and `(path, headers?)` for `delete`. Update `httpClient.test.ts` accordingly.

### 2 — Routes

File: `frontend/src/features/identity/users/UserRoutes.tsx`

```tsx
export default function UserRoutes() {
  return (
    <Routes>
      <Route index element={<UserListPage />} />
      <Route path="new" element={<PermissionGate permission="User.Create" fallback={<Navigate to=".." replace />}><UserCreatePage /></PermissionGate>} />
      <Route path=":id" element={<UserDetailsPage />} />
      <Route path=":id/edit" element={<PermissionGate permission="User.Update" fallback={<Navigate to=".." replace />}><UserEditPage /></PermissionGate>} />
    </Routes>
  );
}
```

Route-level permission gates are UI convenience; backend `require_permission(...)` (see `users.py` lines 44, 57, 89, 104, 119, 128, 143) remains the security boundary.

### 3 — List page

File: `frontend/src/features/identity/users/UserListPage.tsx`

- `useApiData({ fetch: (c) => listUsers(c, { limit: 25, offset: page * 25 }), deps: [page] })`.
- `<AsyncBoundary>` wraps `<Table>` with columns Full name / Email / Active (`<Status>` component) / Roles (`<Badge>` chips) / Actions.
- Actions column contains `<PermissionGate permission="User.Update">…Edit link…</PermissionGate>`, `<PermissionGate permission="User.AssignRole">…Manage roles…</PermissionGate>`, `<PermissionGate permission="User.Delete">…Delete…</PermissionGate>`.
- "Create user" button in the page header, wrapped in `<PermissionGate permission="User.Create">` linking to `new`.
- `<Pagination>` bound to the current page + total (backend endpoint returns a flat list; treat "fewer than `limit` returned" as last page — mark as a **known limitation** in a code comment and file follow-up).

### 4 — Details page

File: `frontend/src/features/identity/users/UserDetailsPage.tsx`

- `useApiData` for `getUser(id)`.
- Section 1 — profile: full name, email, is_customer flag.
- Section 2 — `<UserActivationToggle>` (permission `User.Update`): calls `setUserActive`, on success re-runs `reload()`, on failure toast.
- Section 3 — Roles: shows badges + "Manage roles" button gated on `User.AssignRole` opens `<UserRoleAssignModal>`.
- Section 4 — footer: `<ConfirmDialog>` triggered "Delete user" (`User.Delete`); on confirm calls `deleteUser`, navigates back to `/admin/users`, toasts success.

### 5 — Create page

File: `frontend/src/features/identity/users/UserCreatePage.tsx`

- `useForm` with schema:
  ```ts
  const schema = z.object({
    email: emailSchema,
    password: passwordSchema,
    full_name: nonEmptyStringSchema.max(200, 'validation.maxLength|200'),
    is_customer: z.string(), // '0'/'1' or use a separate state, keep form values as strings
    role_ids: z.string(), // serialized JSON of the multi-select
  });
  ```
- On submit, parse `role_ids` back to `string[]`, call `createUser`, toast success, `navigate('..')`.
- Duplicate account (`409` / `code === 'duplicate_account'`) → inline error via `submitError`; other 4xx → generic; 5xx → generic.
- **Password not retained** — call `setField('password', '')` before navigation.

### 6 — Edit page

File: `frontend/src/features/identity/users/UserEditPage.tsx`

- Load user via `useApiData(getUser(id))`.
- Editable fields: `email`, `full_name` only. `PATCH /users/{id}` (see backend `users.py` line 89).
- Success → toast, navigate to details.

### 7 — Role assignment modal

File: `frontend/src/features/identity/users/UserRoleAssignModal.tsx`

- On open: `useApiData` for `/roles?limit=100` (add a lightweight `listRoles` in this file or import from Story 05's `api.ts` if that story is already merged; safest is to add a local `listAllRoles` here and let Story 05 refactor).
- Multi-select of roles with checkboxes prefilled from the user's current roles. On save call `assignRoles(id, selected)`. On success:
  - Toast.
  - If the edited user id === current `useAuth().user?.id`, call `reloadIdentity()` so the current session picks up the new permission set immediately.

### 8 — `reloadIdentity` on `AuthProvider`

File: `frontend/src/features/authentication/AuthProvider.tsx`

Add:

```ts
const reloadIdentity = useCallback(async () => {
  const token = accessTokenRef.current;
  if (!token) return;
  const me = await fetchMe(authClient, token);
  const roleIds = me.roles.map((r) => r.id);
  const permissions = await fetchPermissionsForRoles(authClient, token, roleIds);
  const nextUser = toAuthUser(me, permissions);
  setUser(nextUser);
  setSessionInStore({ user: nextUser, accessToken: token, refreshToken: refreshTokenRef.current ?? '' });
}, [authClient, setSessionInStore]);
```

Add to `AuthContextValue`, memoized value, and dependency array (mirroring `signIn`).

### 9 — i18n

File: `frontend/src/shared/i18n/locales/en/common.json` — add `admin.users.*` block with strings for headings, buttons, confirm dialog, activation labels, table columns, empty state, "Manage roles" modal title, "Delete user" confirm, and success toasts. Mirror in `ar`.

---

## Edge Cases & Failure Modes

- **User tries to delete themselves** — backend behaviour is not restricted; UI must warn: if `id === current user.id`, disable the delete action and show a tooltip `admin.users.errors.cannotDeleteSelf`.
- **User deactivates themselves** — same treatment; disable the toggle when `id === current user.id`.
- **Duplicate email on create** → 409 `duplicate_account` (see `error_handlers.py` line 42) → inline field error on the email input.
- **Weak password on create** → 422 `validation_failed` (see `error_handlers.py` line 48) → inline error under password.
- **Role assignment includes a role id that no longer exists** → backend responds 404 (`role_not_found`) — display toast `admin.users.errors.assignFailed`; leave modal open with the previous selection.
- **Pagination edge case** — page shows fewer than `limit` rows → hide next arrow. Backend list endpoint has no `total` (documented follow-up).
- **Simultaneous edit by another admin** — no optimistic locking on the backend; last write wins. Document in code comment.
- **Long full name / unicode / RTL text** — `<Table>` cells must wrap; verify via the Arabic locale.

---

## Test Plan

1. **API — `users/api.test.ts`**: assert each function issues the correct method, path, body.
2. **List — `UserListPage.test.tsx`**: renders rows, hides Create button without `User.Create`, hides Delete without `User.Delete`, paginates.
3. **Details — `UserDetailsPage.test.tsx`**: renders, activation toggle triggers PATCH, delete confirm triggers DELETE and navigates back.
4. **Create — `UserCreatePage.test.tsx`**: successful create + navigation + toast; duplicate email → inline error; password never present in form state after success.
5. **Edit — `UserEditPage.test.tsx`**: submits only email/full_name; unchanged fields not sent.
6. **Role assign — `UserRoleAssignModal.test.tsx`**: preselects, save calls PUT with sorted ids; when editing the current admin's roles, `reloadIdentity` is invoked.
7. **AuthProvider — extend `AuthProvider.test.tsx`**: `reloadIdentity` re-fetches `me`+permissions and updates `user`.
8. **HttpClient — extend `httpClient.test.ts`**: `put`, `patch`, `delete` sugar methods hit the right verbs.

---

## Verification Steps

1. **Frontend tests:** `pnpm test` in `frontend/`.
2. **Frontend builds:** `pnpm build` in `frontend/`.
3. **Manual smoke:** sign in as the seeded admin. Create a user, edit them, toggle active, assign a role, delete them. Sign in as a role missing `User.Delete`; confirm the Delete action is hidden and calling `DELETE /users/{id}` from devtools still returns 403.

---

## Done Criteria

- [ ] All eight endpoints in `users.py` have a UI entry point behind the correct permission gate.
- [ ] `reloadIdentity` on `AuthProvider` updates the current admin's own permissions after a self-edit.
- [ ] `HttpClient` exposes `put`, `patch`, `delete` sugar.
- [ ] `pnpm test` + `pnpm build` pass.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 05.**
