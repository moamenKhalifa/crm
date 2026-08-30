# Architecture

## Why feature-based architecture

Each CRM area (Agent, Admin, Customer Portal) and each CRM module within
those areas will grow independently. Organizing by feature rather than by
technical layer (all components together, all hooks together, etc.) keeps
each feature's routes, components, hooks, and types co-located, so a module
can be added, changed, or removed without touching unrelated code.

## Layer responsibilities

- `app/` — the composition root. Wires providers, routing, and runtime
  configuration together. It is the only layer allowed to import across
  both `features/` and `shared/`.
- `features/` — one folder per CRM area/module. A feature owns its routes,
  components, hooks, and types. Features must not import from each other —
  shared behavior belongs in `shared/`, not in a sibling feature.
- `shared/` — cross-feature building blocks (components, forms, tables,
  modals, hooks, utils, types, the API client). `shared/` must not import
  from `features/` or `app/`; it depends only on the platform and
  third-party libraries.
- `assets/` — static files bundled by Vite.

## The API client stays framework/context free

`shared/api/httpClient.ts` (the `HttpClient` class) takes its base URL and
an optional `Authorization` header supplier as plain constructor arguments —
it has no dependency on React, `app/`, or `features/`. `shared/api/ApiClientProvider.tsx`
exposes it as a React context, but it also takes `baseUrl` and
`getAuthorizationHeader` as **props** rather than reading `useAppConfig()`
or `useAuth()` directly, which would pull `features/authentication` into
`shared/`. Only `app/providers/AppProviders.tsx` is allowed to read both
contexts and pass the resolved values down — that composition is exactly
what `app/` is for.

## Theme & design tokens

`useTheme()` (from `@shared/theme`) supplies the active `ThemeTokens` (light
or dark) and `branding` (`appName`, `logoUrl`). `ThemeProvider` writes every
token to `document.documentElement` as a CSS custom property (`--color-*`,
`--space-*`, `--radius-*`, `--shadow-*`, `--font-*`, `--bp-*`) whenever the
theme changes — components consume these via plain CSS (`var(--color-primary)`
etc.), never by importing token values directly into TSX. **Never hard-code a
color, spacing, radius, or font-size in a component or its `.module.css`** —
if a value isn't already a CSS variable, add it to `src/shared/theme/tokens.ts`
first. `useBreakpoint()` returns the current `'mobile' | 'tablet' | 'desktop' | 'wide'`
bucket for layout logic that can't be expressed in CSS alone; `mediaQuery(min)`
returns a `@media` string for stylesheets.

## Localization & RTL

All user-facing strings live in `src/shared/i18n/locales/{en,ar}/common.json`
and are accessed via `useT()` (a thin, namespace-pinned wrapper around
`react-i18next`'s `useTranslation`) — never as inline English/Arabic
literals in component code. To add a string: add the same key to **both**
locale files, then call `t('your.new.key')`. To add a locale: add
`locales/<code>/common.json`, register it in `src/shared/i18n/config.ts`'s
`resources` map, and extend the `Locale` union in `LocaleProvider.tsx`.

`useLocale()` owns the active locale and persists it; switching locale sets
both `<html lang>` and `<html dir>` (`rtl` for `ar`, `ltr` otherwise). Every
shared component must use **logical CSS properties**
(`padding-inline-start`, `margin-inline-end`, `text-align: start`/`end`,
`inset-inline-start`/`end`) instead of physical ones (`padding-left`,
`text-align: left`, …) so layout flips automatically under `dir="rtl"` — a
component that hard-codes `left`/`right` is a bug, not a style choice.

## Authentication

Provider composition order (`app/providers/AppProviders.tsx`):
`ConfigProvider > ThemeProvider > LocaleProvider > AuthProvider > AuthorizationProvider > ApiClientProvider`.
`AuthProvider` (`features/authentication/AuthProvider.tsx`) owns a private,
unauthenticated `HttpClient` for `/auth/*` calls — it cannot use
`useApiClient()` itself, because `ApiClientProvider` (below it in the tree)
depends on `AuthProvider`'s own `getAccessToken`/`refresh` for its
`Authorization` header and 401-retry hook. That circularity is why the auth
endpoints get their own client rather than the shared one.

`useAuth()` exposes `user`, `status` (`'unknown' | 'anonymous' | 'authenticated'`),
`isAuthenticated`, `signIn`, `signOut`, `getAccessToken`, and `refresh`.
**Token storage policy:** the access token lives only in memory (a ref
inside `AuthProvider`, mirrored into `useAppStore` for read access
elsewhere); the refresh token is memory-only by default and is mirrored to
`sessionStorage['crm.rt']` **only** when the user checks "remember me" —
neither token is ever written to `localStorage`. **Never log** a password,
access token, or refresh token — not via `console.log`, not in an error
boundary, not in a thrown error's message.

## Authorization

`useAuthorization()` (from `@shared/authorization`) exposes `hasRole`,
`hasAnyRole`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions`,
reading from `AuthorizationProvider`'s `{ roles, permissions }` (composed in
`AppProviders` from the store `AuthProvider` populates). `<RequireAuth>`
guards routes — it needs the caller to pass `status` as a prop (`shared/`
cannot import `useAuth` from `features/`; see `app/routing/AppRouter.tsx`'s
`Protected` wrapper for the pattern). `<PermissionGate>` guards UI the same
way without navigating.

**The backend remains the final security boundary.** `<RequireAuth>` and
`<PermissionGate>` only control what a user *sees* — every API endpoint
enforces its own permission check independently, and a hidden button is not
a substitute for that check.

## API client

`useApiClient()` (from `@shared/api`) returns the shared `HttpClient`.
`HttpClient` attaches the current `Authorization` header on every request; on
a `401` it calls the configured `onUnauthorized()` **once** (concurrent 401s
share a single in-flight call) and retries the original request exactly once
if it returns `true` — never loops. Inject `onUnauthorized`/`onForbidden` via
`<ApiClientProvider>`'s props (see `AppProviders.tsx`), not by importing auth
context directly into `shared/`. Narrow a caught error with `isUnauthorized`,
`isForbidden`, `isNotFound`, `isValidationError`, `isNetworkError`,
`isServerError` from `@shared/api`. `NETWORK_ERROR` (`status: 0`) is emitted
only when `fetch` itself rejects (offline, DNS failure, CORS) — never for an
HTTP error response.

## Validation

`src/shared/validation/rules.ts` has small composable rules (`required`,
`email`, `minLength(n)`, `maxLength(n)`, `passwordStrength`, `compose(...)`)
returning an i18n key (or `"key|param"` for parametric messages — decode
with `resolveValidationMessage`). `schemas.ts` has reusable Zod schemas
(`emailSchema`, `passwordSchema`, `nonEmptyStringSchema`); a feature
composes its own `z.object({...})` from these. `useForm({ initial, schema,
onSubmit })` is a minimal typed form hook with no `react-hook-form`
dependency — extend it by writing a bigger schema, not by reaching past it.

## Application states

Pair `useAsync(fn, deps)` (from `@shared/hooks`) with
`<LoadingState>`/`<EmptyState>`/`<ErrorState onRetry>`/`<SuccessState>` (from
`@shared/components`) for any data-fetching UI:
`status === 'loading' ? <LoadingState /> : status === 'error' ? <ErrorState onRetry={run} /> : data.length === 0 ? <EmptyState /> : <YourContent />`.
`<Button loading>` disables itself and shows a spinner for in-flight
submissions.

## Where to add a new module

Create a new folder under `src/features/<module>/` with its own routes,
components, hooks, and types. Register its route(s) from
`src/app/routing/AppRouter.tsx` behind the appropriate area (`/agent/*`,
`/admin/*`, `/portal/*`), wrapped in `<Protected>` (or `<RequireAuth>`
directly) with the `role`/`permission` it needs. Register any nav entry in
`AppSidebar`'s `items` with the same `role`/`permission` so the UI and the
route agree. Use `useApiClient()` for all HTTP, shared components from
`@shared/components`, and add new strings only to the i18n resource files —
never a sibling feature's internals.
