# Story 06 — Permission management (Story: 5)

## Prerequisites

- [Story 03](./03-story-admin-shell-and-permission-nav-5.md) completed — admin shell.
- [Story 04](./04-story-user-management-5.md) completed — `HttpClient` sugar methods live.
- [Story 05](./05-story-role-management-5.md) completed — the role permission-assignment modal in Story 05 imports `listPermissions` from here; land Story 05 first if you plan to merge them together, otherwise leave the local `listAllPermissions` fallback introduced in Story 05.

---

## Story Goal

Complete **Permission management** under `/admin/permissions`, wired to `backend/app/modules/identity_access/api/routers/permissions.py` (lines 28–91) — the five endpoints: list / create / get / update / delete, gated by `Permission.View`, `Permission.Create`, `Permission.Update`, `Permission.Delete`.

Screens:

- **List** (`/admin/permissions`) — `<Table>` with Code / Description / Actions. Emphasise the code column (monospace) so admins can read the capability at a glance.
- **Details** (`/admin/permissions/:id`) — code, description, and (bonus) a read-only list of roles that reference the permission if any backend endpoint exposes it. If none exists, omit this section and document it as a follow-up.
- **Create** (`/admin/permissions/new`) — `code` (`min 1 / max 150`, uppercase-dot format e.g. `User.View`), `description` (optional `max 500`).
- **Edit** (`/admin/permissions/:id/edit`) — same fields, PATCH.
- **Delete** — confirm dialog (Perm.Delete).

Out of scope: bulk import, permission grouping in the UI (beyond alphabetical sort), role-back-reference lookup (unless the API exists).

---

## Context — Read These Files First

1. `backend/app/modules/identity_access/api/routers/permissions.py` — read all 91 lines.
2. `backend/app/modules/identity_access/api/schemas/permission.py` — DTOs. Note `code` `min_length=1, max_length=150`.
3. `backend/app/modules/identity_access/domain/errors.py` — for `DuplicatePermissionError` mapping (see `error_handlers.py` line 44).
4. Story 04's `UserCreatePage.tsx` and `UserEditPage.tsx` — mirror the structure and error routing.
5. `backend/app/modules/identity_access/infrastructure/seed.py` — read to see the canonical permission code format the UI should hint at (`User.View`, `Role.Create`, …).

---

## Implementation tasks

Directory:

```
frontend/src/features/identity/permissions/
├── PermissionRoutes.tsx
├── api.ts
├── PermissionListPage.tsx
├── PermissionDetailsPage.tsx
├── PermissionCreatePage.tsx
├── PermissionEditPage.tsx
└── *.test.tsx
```

Replace the placeholder `PermissionRoutes` from Story 03.

### 1 — API layer

File: `frontend/src/features/identity/permissions/api.ts`

```ts
export function listPermissions(client: HttpClient, params: { limit: number; offset: number }) { … }
export function getPermission(client: HttpClient, id: string) { return client.get<PermissionSummaryResponse>(`/permissions/${id}`); }
export function createPermission(client: HttpClient, body: { code: string; description?: string | null }) { return client.post<PermissionSummaryResponse>('/permissions', body); }
export function updatePermission(client: HttpClient, id: string, body: { code?: string; description?: string | null }) { return client.patch<PermissionSummaryResponse>(`/permissions/${id}`, body); }
export function deletePermission(client: HttpClient, id: string) { return client.delete<void>(`/permissions/${id}`); }
```

If Story 05 landed with a local `listAllPermissions`, refactor it to import from this file.

### 2 — Routes

File: `frontend/src/features/identity/permissions/PermissionRoutes.tsx` — mirror `UserRoutes` / `RoleRoutes`.

### 3 — Pages

Zod schema (create):

```ts
const createSchema = z.object({
  code: z.string().trim().min(1, 'validation.required').max(150, 'validation.maxLength|150')
    .regex(/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)*$/, 'admin.permissions.errors.codeFormat'),
  description: z.string().max(500, 'validation.maxLength|500').optional(),
});
```

The regex enforces the `Section.Action` convention (matches the seeded values in `backend/app/modules/identity_access/infrastructure/seed.py`); the backend does **not** enforce this, so it is a UX hint only — document in a code comment.

Error routing:

- 409 `duplicate_permission` (see `error_handlers.py` line 44) → inline field error on `code`.
- 422 → generic form error.
- 404 on Edit/Details → route to `/admin/permissions` with a toast.

Critical: **Editing or deleting a permission that is part of the current admin's effective set** must trigger `useAuth().reloadIdentity()` after success — condition: `useAuth().user?.permissions.includes(permission.code)`. Otherwise the admin might keep an in-memory permission the backend has already revoked.

### 4 — i18n

Add `admin.permissions.*` in both locales.

---

## Edge Cases & Failure Modes

- **Deleting a permission still assigned to roles** — behaviour depends on `backend/app/modules/identity_access/application/use_cases/permissions/delete_permission.py` (read the file). If the backend cascades, warn in the confirm-dialog body: `admin.permissions.confirmDelete.body`. If it rejects, surface the message from `error.message`.
- **Renaming a code that admins depend on** — after update, run `reloadIdentity()` when the code was in the admin's own set (see task 3).
- **Invalid code format** — regex catches most, but backend has final authority.
- **Duplicate code on create** → 409, inline error.
- **Very long code (>150 chars)** — schema catches, no request sent.

---

## Test Plan

1. **API** — `permissions/api.test.ts`.
2. **List** — actions gated correctly.
3. **Create** — validation regex + duplicate 409 handling.
4. **Edit** — self-affecting edit triggers `reloadIdentity`.
5. **Delete** — self-affecting delete triggers `reloadIdentity` and redirects to list.

---

## Verification Steps

1. **Frontend tests:** `pnpm test`.
2. **Frontend builds:** `pnpm build`.
3. **Manual smoke — full AC-15 end-to-end (final acceptance flow for the whole feature):**
   1. Register a customer at `/register` → land at `/agent`.
   2. Sign out; sign in as the seeded admin (`backend/app/modules/identity_access/infrastructure/seed.py`).
   3. Create a role, assign permissions, assign the role to a new user.
   4. Sign in as that user, confirm only the granted admin pages appear in the sidebar; typing a URL for an ungranted page bounces to `/forbidden`.
   5. Wait for access-token expiry (see `jwt_access_token_ttl_seconds` in `backend/app/shared/config/settings.py`) or shorten it in dev; the next protected request should transparently refresh via `HttpClient.onUnauthorized` (see `frontend/src/shared/api/httpClient.ts` lines 83–113).
   6. Revoke your refresh token from the backend (e.g. call `/auth/logout` from another tab), then trigger a protected call; expect the "session expired" toast and a redirect to `/sign-in`.
   7. Sign out.
4. **Regression:** full `pnpm test` — all identity CRUD suites plus the foundation suites must pass.

---

## Done Criteria — feature-wide (this is the final story)

- [ ] All five permission endpoints have a UI entry point behind the correct permission gate.
- [ ] `reloadIdentity` is invoked whenever an edit affects the current admin's own permission set.
- [ ] AC-01 through AC-16 from the intake all pass a manual walkthrough.
- [ ] `pnpm test` + `pnpm build` green; no `console.log` of tokens or passwords in the source (grep `console\.` under `frontend/src/features/identity` and `frontend/src/features/authentication` before merging).
- [ ] All `admin.*` i18n keys present in both `en` and `ar` locale files.

**End of feature. Report completion to the user.**
