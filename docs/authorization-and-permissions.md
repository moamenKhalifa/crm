# Authorization & Permissions — Least-Privilege Fixes

**Status:** Implemented and verified.
**Scope:** Cross-cutting fix to the Identity & Access module's permission model. Not tied to a `.squad` story number — found and fixed during manual testing of Story 15's output.
**Audience:** Use this as the reference when adding any new page, filter, or picker that touches a *different* resource than the one the page is nominally gated on (e.g. a Users page that also needs Role data, a Roles page that also needs Permission data, an Orders page that also needs Customer data, etc.). The rules below are meant to be reused, not re-derived.

---

## 1. The two bugs

Both were found from the same symptom: a role with a narrow, intentionally-scoped permission set (e.g. only `User.View`) got blocked with `insufficient_permissions` / `Missing required permission: Role.View` in places it should not have.

### 1.1 Login itself was broken for any non-admin-ish role (severe)

**Symptom:** A user whose role did not include `Role.View` could not sign in at all — the login form showed a generic "Something went wrong" error.

**Root cause:** After `POST /identity/auth/login`, the frontend's auth bootstrap (`AuthProvider.tsx`) resolved the signed-in user's *own* effective permission set by calling `GET /identity/roles/{role_id}/permissions` once per role the user held. That endpoint is (correctly) gated by `Role.View`, because in every other context it means "view a role's permission list." But here it was being used for something else entirely — "tell me my own permissions" — and a user without `Role.View` got a 403 on their own login.

This is the class of bug to watch for: **reusing a resource-scoped endpoint for a self-scoped need.** "What can I do" is not the same permission boundary as "what can I see about resource X."

### 1.2 List-page filters silently required a sibling resource's `.View` permission (minor, UX)

**Symptom:** A user with `User.View` (but not `Role.View`) could open the Users list fine, but the page's "filter by role" dropdown triggered a 403 network call and a global "Forbidden" toast.

**Root cause:** `UserListPage.tsx` calls `GET /identity/roles` (gated by `Role.View`) purely to populate the *options* of an optional filter control — not to render anything the page actually needs (role names per user already come embedded in the user records). Same pattern in `RoleListPage.tsx` calling `GET /identity/permissions` (gated by `Permission.View`) for its permission filter.

---

## 2. What was implemented

### 2.1 Fix for 1.1 — `/auth/me` now returns the caller's own effective permissions

- **`backend/app/modules/identity_access/api/schemas/user.py`** — new `MeResponse(UserResponse)` with `permissions: list[str]`. Deliberately **not** added to the base `UserResponse` used by the users list/detail endpoints — a viewer with `User.View` must not be able to read *another* user's permission set just by looking up their record. `permissions` only appears on the response for `/auth/me`, i.e. always "your own."
- **`backend/app/modules/identity_access/api/routers/auth.py`** — `GET /auth/me` now calls `resolve_effective_permissions(user, role_repo, permission_repo)` (the same live, uncached resolver `require_permission()` itself uses) and returns it alongside the existing user summary. Gated only by `get_current_user` (i.e. "authenticated," full stop) — no permission code required, because you are always entitled to know your own permissions.
- **`frontend/src/features/authentication/api.ts`** — `fetchMe()` now returns `MeResponse` (`UserResponse & { permissions: string[] }`). Deleted `fetchPermissionsForRoles()` entirely — it no longer has a caller.
- **`frontend/src/features/authentication/AuthProvider.tsx`** — both places that used to do `fetchMe()` → `fetchPermissionsForRoles()` (the initial bootstrap and `reloadAuthContext()`) now just read `me.permissions` directly. One network call instead of `1 + N`.

**Why this is the right shape, not a workaround:** the frontend had a pre-existing `TODO(backend)` comment on `fetchPermissionsForRoles` saying exactly this — "derive the effective permission set client-side by fanning out per role" *until* `/auth/me` exposes `permissions[]`. This closes that gap the way it was already meant to be closed, not a bespoke patch.

### 2.2 Fix for 1.2 — optional cross-resource lookups degrade instead of erroring

- **`frontend/src/shared/api/httpClient.ts`** — `RequestOptions` gained `suppressForbiddenHandling?: boolean`. When set, a 403 on that specific request still rejects the promise (callers still see the error), but skips the app-wide `onForbidden` callback (the global "Forbidden" toast + `reloadAuthContext()` reconciliation). `HttpClient.get()` accepts it as a third argument.
- **`frontend/src/features/identity/roles/api.ts`** (`listRoles`) and **`frontend/src/features/identity/permissions/api.ts`** (`listPermissions`) — both accept an `options?: { suppressForbiddenHandling?: boolean }` passthrough.
- **`frontend/src/features/identity/users/UserListPage.tsx`** — the `listRoles()` call used to populate the role filter now passes `suppressForbiddenHandling: true`. `canFilterByRole = !isForbidden(rolesQuery.error)` gates whether the `role_id` filter is included in the `filters` array at all — omitted entirely (not rendered empty) when forbidden. Everything else on the page (the actual user rows, their embedded role names, every other filter) works normally regardless.
- **`frontend/src/features/identity/roles/RoleListPage.tsx`** — identical treatment for the `has_permission_id` filter backed by `listPermissions()`.
- Deliberately **left untouched**: `UserCreatePage.tsx`, `UserRoleAssignModal.tsx`, `RolePermissionAssignModal.tsx`. These call `listRoles`/`listPermissions` to populate an *assignment* picker (choosing a role to assign, a permission to attach) — if you can't see the list, the action genuinely cannot be completed, so a hard denial there is correct, not a false conflict. Only "filter my own already-visible list by an attribute of a sibling resource" was in scope.

---

## 3. The reusable criteria (apply these to future work)

These are the rules that came out of this fix. When you build the next feature that touches more than one resource, check it against this list before writing the permission gate.

1. **"What are my own permissions" is never resource-scoped.** Any endpoint whose purpose is "tell the caller about themselves" (their own permissions, their own profile, their own settings) must be gated by "authenticated," not by a permission that happens to describe similar data for *other* records. If you're tempted to reuse `GET /roles/{id}/permissions` (or any `{id}`-scoped endpoint) to answer a question about the *caller*, stop — that's the 1.1 bug shape again.

2. **A `.View` permission on resource A does not imply `.View` on resource B**, even when A's UI would like to show or filter by B. Two sub-cases:
   - **B's data is only used for *display* on A's page** (e.g. a user's role name shown in a table cell): fetch it as part of A's own response (embed it), not via a second call gated by B's permission. This project already does this — `UserResponse.roles[].name` is embedded, which is exactly why the list page didn't break entirely, only the filter did.
   - **B's data is only used for an *optional filter/picker convenience***: fetch it with `suppressForbiddenHandling: true`, and hide the affected control when the fetch is forbidden (check with `isForbidden(query.error)` from `@shared/api`). Never let an optional convenience lookup block or degrade the page's core purpose, and never let it fire the global "Forbidden" toast — that toast is reserved for the user's own primary action being denied.

3. **When B's data is genuinely required to complete the action** (assigning a role, attaching a permission — you cannot pick from a list you cannot see), a hard denial is correct and expected. Don't apply rule 2's graceful-degradation pattern here; the user needs to know the action isn't possible for them.

4. **Never expose another principal's permission set through a shared response shape.** `permissions[]` lives only on `MeResponse` (used solely by `/auth/me`), specifically so that `GET /identity/users` / `GET /identity/users/{id}` (used by any `User.View` holder to look at *other* people) can never leak what an admin or any other user is capable of.

5. **The global 403 handler (`onForbidden` in `AppProviders.tsx`) is for "the user's core, in-the-moment action was denied."** Any request that isn't that — a background convenience lookup, a speculative prefetch — should pass `suppressForbiddenHandling: true` and handle its own denial locally.

---

## 4. Verification performed

- **Backend:** `uv run pytest -q` → **151/151 passing** (3 new tests in `tests/identity_access/api/test_auth_endpoints.py`: `/me` returns permissions for an admin, `/me` returns `[]` for a roleless customer, and the direct regression — a role with only `User.View` can call `/me` and get `["User.View"]` back without hitting `Role.View`). `ruff check` and `mypy` clean on all touched files.
- **Frontend:** `pnpm typecheck` / `pnpm lint` (0 errors) / `pnpm exec stylelint` all clean. `pnpm test -- --run` → **480/480 passing** across 93 files, including:
  - A direct regression test in `AuthProvider.test.tsx` asserting sign-in never calls any `/roles/*/permissions` URL.
  - `HttpClient` tests for `onForbidden` firing on a normal 403 and being skipped with `suppressForbiddenHandling`.
  - `UserListPage.test.tsx` / `RoleListPage.test.tsx` tests asserting the list still renders fully, the sibling-resource filter is omitted (not empty), and no "Forbidden" toast appears, when the picker lookup 403s.
  - Every existing test file that mocked the old two-step bootstrap (`/auth/me` then `/roles/{id}/permissions`) updated to the new single-call shape (`AppProviders.test.tsx`, `SignInPage.test.tsx`, `SignOut.multiTab.test.tsx`, `PermissionDetailsPage.test.tsx`, `UserDetailsPage.test.tsx`, `AppRouter.test.tsx`).
- `pnpm build` clean.

---

## 5. Files touched (for quick lookup)

**Backend**
- `backend/app/modules/identity_access/api/schemas/user.py` — added `MeResponse`
- `backend/app/modules/identity_access/api/routers/auth.py` — `/me` resolves and returns `permissions`
- `backend/tests/identity_access/api/test_auth_endpoints.py` — new tests

**Frontend**
- `frontend/src/shared/api/httpClient.ts` — `suppressForbiddenHandling` option
- `frontend/src/features/authentication/api.ts` — `MeResponse` type, `fetchMe()` return type, deleted `fetchPermissionsForRoles`
- `frontend/src/features/authentication/AuthProvider.tsx` — reads `me.permissions` directly
- `frontend/src/features/identity/roles/api.ts` — `listRoles()` accepts `suppressForbiddenHandling`
- `frontend/src/features/identity/permissions/api.ts` — `listPermissions()` accepts `suppressForbiddenHandling`
- `frontend/src/features/identity/users/UserListPage.tsx` — role filter degrades gracefully
- `frontend/src/features/identity/roles/RoleListPage.tsx` — permission filter degrades gracefully
- Test files listed in §4 above, updated for the new bootstrap shape.

---

## 6. Open item, not yet needed

`RoleDetailsPage.tsx`, `PermissionListPage.tsx`, and any future page that fetches a sibling resource purely for a filter/picker should follow the same pattern in §3 rule 2 if/when they grow such a lookup. None currently do, so nothing to change today — just apply the pattern when the need arises rather than retrofitting speculatively.
