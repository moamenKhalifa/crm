# Story 02 — Logout UI, header user menu, persistence hardening (Story: 5)

## Prerequisites

- [Story 01](./01-story-error-envelope-and-registration-5.md) completed — envelope decoder is fixed and the `ApiError.code` values are reliable for the toast/error routing added here.

---

## Story Goal

The frontend already has a working `signOut()` on `AuthProvider` (see `frontend/src/features/authentication/AuthProvider.tsx` lines 181–192) and a working refresh-token bootstrap (lines 147–170). What's missing:

1. A **user menu in the app header** with the authenticated user's name/email and a **Sign out** action.
2. A tiny wrapper that mounts the header inside every protected area (agent / admin / portal) so the menu is visible everywhere the user is authenticated.
3. **Persistence hardening** — the current bootstrap silently swallows every non-401 refresh failure (line 165–167). Split the handling so that network failures leave `status: 'unknown'` briefly and retry, while 4xx failures clear the session; document why in a code comment.
4. A **global 401→forced-logout toast** ("Your session has expired"), plugged into the existing `onUnauthorized` handler in `frontend/src/app/providers/AppProviders.tsx` (lines 56–62).

Out of scope: any admin CRUD (Stories 03–06).

---

## Context — Read These Files First

1. `frontend/src/features/authentication/AuthProvider.tsx` — read lines 88–192 in full.
2. `frontend/src/app/providers/AppProviders.tsx` — the composition point for `onUnauthorized`.
3. `frontend/src/shared/components/navigation/AppHeader.tsx` — the header shell used everywhere; it accepts a `userMenu?: ReactNode` slot (line 9).
4. `frontend/src/shared/components/overlay/Dropdown.tsx` — the primitive to use for the menu (has `DropdownItem[]` API — grep it).
5. `frontend/src/shared/components/feedback/ToastProvider.tsx` — exposes `useToast()`; add `<ToastProvider>` to the provider stack in Story 02 if it is not already mounted (grep first).
6. `frontend/src/features/agent/AgentArea.tsx`, `frontend/src/features/admin/AdminArea.tsx`, `frontend/src/features/portal/PortalArea.tsx` — placeholders that must gain the shared header layout.
7. `frontend/src/features/authentication/AuthProvider.test.tsx` — reference for how to render `AuthProvider` in tests (`AuthContextValue` is exported).
8. `frontend/src/app/store/appStore.ts` lines 3–49 — the shared store where user info already lives.

---

## Implementation tasks

### 1 — Shared authenticated layout

Create file: `frontend/src/shared/components/layout/AuthenticatedLayout.tsx`

A thin `AppHeader`-with-user-menu wrapper. It receives no auth props; it composes them from `@shared/authorization`'s `useAuthorization` for roles/permissions **and** takes the display name / sign-out handler as props (do not import `@features/*` from `@shared/*` — same rule as `AuthorizationProvider`, see `AuthorizationProvider.tsx` lines 14–18).

```tsx
export interface AuthenticatedLayoutProps {
  displayName: string;
  email: string;
  onSignOut(): void;
  children: ReactNode;
}
```

Renders `<AppHeader branding={...} userMenu={<UserMenu ... />}>` above `{children}`. Read the branding from the existing `useAppConfig` — **but** since layout lives in `@shared`, keep it side-effect-free: accept `branding` as an optional prop or read via a small helper in `@shared/theme` (`defaultBranding` already exists — see `frontend/src/shared/theme/branding.ts`).

Create file: `frontend/src/shared/components/layout/UserMenu.tsx`

Uses `<Dropdown>` (see `frontend/src/shared/components/overlay/Dropdown.tsx`). Trigger label: `displayName` (fallback `email`). Items: **Sign out** (`onSelect={onSignOut}`). Do not include any raw token or role in the DOM.

Export both from `frontend/src/shared/components/index.ts` alongside the existing exports.

### 2 — App-level layout wrapper that binds the auth handlers

Create file: `frontend/src/features/authentication/AuthenticatedShell.tsx`

Small component that lives in `features/` so it may import `useAuth`. It:

- Reads `useAuth().user` and `useAuth().signOut`.
- Renders `<AuthenticatedLayout displayName={user.fullName} email={user.email} onSignOut={handleSignOut}>{children}</AuthenticatedLayout>`.
- `handleSignOut` awaits `signOut()`, then calls `navigate('/sign-in', { replace: true })` from `useNavigate()`. Fire-and-forget: if `signOut` throws the `AuthProvider` already clears local state.

Update each area to use it — do **not** add sub-routes yet, just wrap the placeholder:

- `frontend/src/features/agent/AgentArea.tsx`
- `frontend/src/features/admin/AdminArea.tsx`
- `frontend/src/features/portal/PortalArea.tsx`

Each becomes:

```tsx
export default function AgentArea() {
  return (
    <AuthenticatedShell>
      <h1>Agent</h1>
      {/* CRM modules for this area will register their own sub-routes here. */}
    </AuthenticatedShell>
  );
}
```

### 3 — Persistence hardening in `AuthProvider`

File: `frontend/src/features/authentication/AuthProvider.tsx`

Replace the current `catch { clearSession(); }` in the bootstrap effect (lines 165–167) with a discriminating handler:

```ts
} catch (error) {
  // 4xx from refresh = the stored token is truly bad → force anonymous.
  // Network / 5xx = leave `status = 'unknown'` and retry once after 2s.
  //   Prevents a transient offline state from silently logging the user out
  //   between tabs, and satisfies AC-13 ("not incorrectly treated as
  //   authenticated when valid authentication can no longer be established").
  if (isApiError(error) && error.status >= 400 && error.status < 500) {
    clearSession();
  } else {
    setTimeout(() => {
      void (async () => {
        try {
          const retryTokens = await refreshRequest(authClient, storedRefreshToken);
          await bootstrapSession(retryTokens);
        } catch {
          clearSession();
        }
      })();
    }, 2000);
  }
}
```

Apply the same discrimination inside the runtime `refresh()` callback (lines 210–215): the existing check already special-cases `401`; extend to include any 4xx (`error.status >= 400 && error.status < 500`) so a `403 revoked_refresh_token` also clears the session. Leave `NETWORK_ERROR` alone → `refresh` returns `false` and `HttpClient` will not retry; downstream `onUnauthorized` in `AppProviders` will call `signOut`, which is acceptable.

### 4 — Global session-expired toast

File: `frontend/src/app/providers/AppProviders.tsx`

- Confirm `<ToastProvider>` is in the tree; if it is not, add it directly under `ThemeWithConfig` and above `AuthProvider`. (Grep first: `grep ToastProvider frontend/src/app/`.)
- Convert `ApiClientWithConfig` (lines 45–67) so it also uses `useToast()`. Extend `onUnauthorized` (line 56):
  ```ts
  onUnauthorized={async () => {
    const refreshed = await refresh();
    if (!refreshed) {
      toast.push({ variant: 'error', message: t('auth.errors.sessionExpired') });
      await signOut();
    }
    return refreshed;
  }}
  ```
  Wire `t` via `useT()` and `toast` via `useToast()`.
- Also wire `onForbidden` to push a toast keyed off `errors.forbidden` (this covers the "insufficient permissions" case system-wide).

### 5 — No new i18n keys required

`auth.signOut`, `auth.errors.sessionExpired`, `errors.forbidden` already exist in `frontend/src/shared/i18n/locales/en/common.json` (lines 7, 13, 19).

---

## Edge Cases & Failure Modes

- **Sign out with no server reachability** — `signOut` already catches (see `AuthProvider.tsx` lines 184–190) and always calls `clearSession()`; the navigation still runs. No change needed.
- **Sign out from two tabs simultaneously** — each tab clears its own state; sessionStorage removal is idempotent (see `writeStoredRefreshToken` at lines 60–70).
- **Bootstrap retry loop** — the retry runs **once** (no recursion). If it fails, session is cleared. Adding a second retry would risk masking a real revocation → deliberately not added.
- **Toast fires twice on burst 401s** — `HttpClient.refreshOnce` (lines 106–113) already coalesces concurrent refreshes into one promise, so `onUnauthorized` only runs once per burst.
- **User dropdown opens over content** — `Dropdown` already handles focus trap / outside-click (see `frontend/src/shared/components/overlay/Dropdown.tsx`).
- **RTL locale** — `AppHeader` and `Dropdown` are already RTL-aware (see `AppHeader.module.css` and existing `LocaleProvider`). Verify the user menu still opens to the correct side by rendering the `AppSidebar.test.tsx` pattern in RTL mode.

---

## Test Plan

1. **Component — `frontend/src/shared/components/layout/UserMenu.test.tsx`** (new): renders the display name, item click calls the injected `onSignOut`.
2. **Component — `frontend/src/features/authentication/AuthenticatedShell.test.tsx`** (new): mounted inside `<AuthProvider>` with a stubbed `signOut`, clicking the sign-out item calls `signOut` and then navigates to `/sign-in`.
3. **Unit — `AuthProvider.test.tsx`**: add coverage for
   - 4xx refresh failure on bootstrap → status becomes `anonymous` immediately.
   - Network refresh failure on bootstrap → status stays `unknown`, then after retry succeeds becomes `authenticated`. Use `vi.useFakeTimers()` to advance the 2 s retry.
4. **Integration — a new test file `frontend/src/app/providers/AppProviders.test.tsx`** (new): using `msw` or the same fetch-mock pattern as `httpClient.test.ts`, assert that a `401` on a protected request triggers a toast whose message resolves to `auth.errors.sessionExpired` and drives `status` to `anonymous`.
5. **Regression** — existing `SignInPage.test.tsx`, `RegisterPage.test.tsx`, `RequireAuth.test.tsx` unchanged.

---

## Verification Steps

1. **Frontend tests:** `pnpm test` in `frontend/`.
2. **Frontend builds:** `pnpm build` in `frontend/`.
3. **Manual smoke:** `pnpm dev`. Sign in, confirm the header displays your name and a Sign out item. Click Sign out → land on `/sign-in`, back-button attempts to hit `/agent` bounce back to `/sign-in` (`RequireAuth` handles this — see `frontend/src/shared/authorization/RequireAuth.tsx` lines 43–45).
4. **Regression:** open the app, disconnect the network briefly during page load — the app must not clear the session; reconnect and confirm the retry restores it.

---

## Done Criteria

- [ ] `AuthenticatedLayout` + `UserMenu` render in every protected area.
- [ ] Signing out clears local state, hits `POST /auth/logout` when possible, and redirects to `/sign-in`.
- [ ] 4xx bootstrap failures clear the session; network failures retry once before giving up.
- [ ] A single toast appears on failed refresh; forbidden responses show the shared `errors.forbidden` toast.
- [ ] `pnpm test` + `pnpm build` pass.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 03.**
