# Story 05 — Role management (Story: 5)

## Prerequisites

- [Story 03](./03-story-admin-shell-and-permission-nav-5.md) completed — admin shell + `useApiData` + `AsyncBoundary` in place.
- [Story 04](./04-story-user-management-5.md) completed — `HttpClient` sugar (`put`/`patch`/`delete`) added there.

---

## Story Goal

Full **Role management** under `/admin/roles`, wired to `backend/app/modules/identity_access/api/routers/roles.py` (lines 37–133).

Screens:

- **List** (`/admin/roles`) — `<Table>` with Name / Description / Actions. Gated on `Role.View`.
- **Details** (`/admin/roles/:id`) — read-only summary + inline **Permissions** section (chips) with **Assign / Remove permissions** modals.
- **Create** (`/admin/roles/new`) — `name` (`min 1 / max 100`), `description` (optional, `max 500`).
- **Edit** (`/admin/roles/:id/edit`) — same fields, PATCH.
- **Delete** — confirm dialog behind `Role.Delete`.
- **Permission assignment modal** — checkbox list of all permissions, prefilled from `GET /roles/{id}/permissions`. Save calls `PUT /roles/{id}/permissions` (`Role.AssignPermission`).
- **Permission remove** — variant of the same modal, calls `DELETE /roles/{id}/permissions` with a body listing the ids to remove.

Out of scope: bulk role import; role hierarchy.

---

## Context — Read These Files First

1. `backend/app/modules/identity_access/api/routers/roles.py` — read all 133 lines. Note: `PUT /roles/{id}/permissions` **replaces** the whole set (see the use case `AssignPermissionsToRole` in `backend/app/modules/identity_access/application/use_cases/roles/assign_permissions_to_role.py` for exact semantics); `DELETE /roles/{id}/permissions` removes the ids in the body.
2. `backend/app/modules/identity_access/api/schemas/role.py` — `CreateRoleRequest` (line 14), `UpdateRoleRequest` (line 19), `AssignPermissionsRequest` (line 24).
3. `frontend/src/features/authentication/api.ts` — reuse `RoleSummaryResponse`, `PermissionSummaryResponse`.
4. Story 04's `UserRoleAssignModal.tsx` — mirror the multi-select pattern here.
5. `frontend/src/shared/components/overlay/{Modal,ConfirmDialog}.tsx` — same primitives.

---

## Implementation tasks

Directory:

```
frontend/src/features/identity/roles/
├── RoleRoutes.tsx
├── api.ts
├── RoleListPage.tsx
├── RoleDetailsPage.tsx
├── RoleCreatePage.tsx
├── RoleEditPage.tsx
├── RolePermissionAssignModal.tsx
└── *.test.tsx
```

Replace the placeholder `RoleRoutes` from Story 03.

### 1 — API layer

File: `frontend/src/features/identity/roles/api.ts`

```ts
export function listRoles(client: HttpClient, params: { limit: number; offset: number }) { … }
export function getRole(client: HttpClient, id: string) { return client.get<RoleSummaryResponse>(`/roles/${id}`); }
export function createRole(client: HttpClient, body: { name: string; description?: string | null }) { return client.post<RoleSummaryResponse>('/roles', body); }
export function updateRole(client: HttpClient, id: string, body: { name?: string; description?: string | null }) { return client.patch<RoleSummaryResponse>(`/roles/${id}`, body); }
export function deleteRole(client: HttpClient, id: string) { return client.delete<void>(`/roles/${id}`); }
export function getRolePermissions(client: HttpClient, id: string) { return client.get<PermissionSummaryResponse[]>(`/roles/${id}/permissions`); }
export function assignRolePermissions(client: HttpClient, id: string, permissionIds: string[]) { return client.put<RoleSummaryResponse>(`/roles/${id}/permissions`, { permission_ids: permissionIds }); }
export function removeRolePermissions(client: HttpClient, id: string, permissionIds: string[]) { return client.request<RoleSummaryResponse>(`/roles/${id}/permissions`, { method: 'DELETE', body: { permission_ids: permissionIds } }); }
```

### 2 — Routes

File: `frontend/src/features/identity/roles/RoleRoutes.tsx` — same shape as `UserRoutes.tsx` from Story 04: `index`, `new` (`Role.Create`), `:id`, `:id/edit` (`Role.Update`).

### 3 — List / Details / Create / Edit

Follow the same pattern as Story 04's `UserListPage` / `UserDetailsPage` / `UserCreatePage` / `UserEditPage`, adapting field names to `name`, `description`. Zod schemas:

```ts
const createSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(100, 'validation.maxLength|100'),
  description: z.string().max(500, 'validation.maxLength|500').optional(),
});
```

Handle 409 `duplicate_role` (see `error_handlers.py` line 43) as an inline field error on `name`.

### 4 — Permission assignment modal

File: `frontend/src/features/identity/roles/RolePermissionAssignModal.tsx`

- On open: `useApiData` for **both** the full list (`listPermissions` from Story 06's `api.ts`, or a local `listAllPermissions` if Story 06 not yet merged — plan is safe either way) **and** the current selection via `getRolePermissions(id)`. Combine into a checked/unchecked list.
- Save button dispatches:
  - `assignRolePermissions(id, newSelection)` if the delta is additive-or-mixed and semantics is "replace whole set" — safest path since backend `PUT` replaces the entire set (verify by reading `backend/app/modules/identity_access/application/use_cases/roles/assign_permissions_to_role.py`).
  - Alternative flow for the **Remove** button in the details view: `removeRolePermissions(id, [permissionId])`.
- After success:
  - Toast.
  - **If the modified role is currently assigned to the authenticated admin**, call `useAuth().reloadIdentity()` so the sidebar/permissions update — condition: `useAuth().user?.roles.includes(role.name)`.

### 5 — i18n

Add `admin.roles.*` in both locales (headings, columns, buttons, errors including `duplicateRole`, empty states, confirm-delete text, assign-permissions modal strings).

---

## Edge Cases & Failure Modes

- **Duplicate role name on create/update** → 409 `duplicate_role`; inline error on `name`.
- **Delete a role currently assigned to users** — backend behaviour: check `backend/app/modules/identity_access/application/use_cases/roles/delete_role.py`; if it 4xxs, display the message via `submitError`; otherwise proceed. Document real behaviour in a code comment after reading the file.
- **Assigning a permission id that no longer exists** → 404 `not_found` → toast, modal stays open.
- **Empty description** — send `null` (not `""`) — backend accepts both but stores `null` conventionally.
- **Concurrent edits** — no versioning; last write wins. Document.
- **Renaming a role that is currently in the admin's role list** — role NAME is what `useAuthorization().hasRole` matches (see `AuthProvider.tsx` line 77 `me.roles.map((role) => role.name)`); renaming a role that the current admin holds must trigger `reloadIdentity()` after a successful `updateRole`.

---

## Test Plan

1. **API** — `roles/api.test.ts`.
2. **List** — filters actions by permission, paginates.
3. **Details** — shows permission chips; Remove flow works.
4. **Create** — duplicate name → inline error.
5. **Edit** — renaming the admin's own role triggers `reloadIdentity`.
6. **Permission assign modal** — preselects, save calls PUT.

---

## Verification Steps

1. **Frontend tests:** `pnpm test`.
2. **Frontend builds:** `pnpm build`.
3. **Manual smoke:** create a role, assign permissions to it, assign the role to your own user (from Story 04's UI), see the sidebar recompute without a full reload; rename the role, still works; delete the role after removing from users.

---

## Done Criteria

- [ ] All seven role endpoints have a UI entry point behind the correct permission gate.
- [ ] `reloadIdentity` is invoked whenever an edit affects the current admin's role/permission set.
- [ ] `pnpm test` + `pnpm build` pass.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 06.**
