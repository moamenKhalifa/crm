# CRM Frontend

## Overview

The CRM frontend is a React + TypeScript application built with Vite, using a
**feature-based architecture**. It provides the full application foundation —
theming and design tokens, localization (English/Arabic with RTL), real JWT
authentication and role/permission-based authorization, a shared design
system, centralized state, validation, and an API client with transparent
token refresh — for three areas (Agent, Admin, Customer Portal). No CRM
business functionality is implemented yet. See
[`docs/architecture.md`](docs/architecture.md) for how each piece fits
together and how to use it from a new feature.

## Layout

| Path | Purpose |
|---|---|
| `src/app/` | Application-level composition: providers, routing, store wiring, and runtime configuration. No feature code lives here. |
| `src/app/routing/` | Top-level route table and area shell wiring, guarded by `<RequireAuth>`. Feature routes are lazy-loaded from here but never defined here. |
| `src/app/providers/` | Composition of every application-wide provider (config, theme, locale, auth, authorization, API client) in the order they must mount. |
| `src/app/store/` | Centralized state (Zustand): current user, roles, permissions, tokens, locale, theme name. |
| `src/app/configuration/` | Environment-driven runtime configuration: typed env parsing and the config context. |
| `src/features/` | One folder per CRM area or module. Each feature owns its own routes, components, hooks, and types; features must not import from each other. |
| `src/features/authentication/` | Real authentication: `AuthProvider` (login/refresh/logout/`/me`), the sign-in page, and the `/auth/*` API bindings. |
| `src/features/agent/` | Agent experience area shell. |
| `src/features/admin/` | Admin experience area shell. |
| `src/features/portal/` | Customer Portal experience area shell. |
| `src/shared/` | Cross-feature building blocks. No feature-specific logic; must not import `features/` or `app/`. |
| `src/shared/theme/` | Design tokens (`ThemeTokens`, light/dark), `ThemeProvider`/`useTheme`, `useBreakpoint`. |
| `src/shared/i18n/` | `en`/`ar` translation resources, `LocaleProvider`/`useLocale`, `useT`. |
| `src/shared/authorization/` | `AuthorizationProvider`, `useAuthorization`, `<RequireAuth>`, `<PermissionGate>`. |
| `src/shared/validation/` | Composable validation rules, Zod schemas, the `useForm` hook. |
| `src/shared/errors/` | `toUserMessage` — maps any error to an i18n key. |
| `src/shared/components/` | The shared design system: `form/`, `button/`, `data/`, `feedback/`, `overlay/`, `navigation/`, plus `AppLoading`/`RootErrorBoundary`/`NotFoundPage`. |
| `src/shared/hooks/` | Reusable hooks (`useAsync`) and single-import re-exports of the hooks above. |
| `src/shared/utils/`, `src/shared/types/` | Pure utilities and shared types. |
| `src/shared/api/` | Framework-agnostic HTTP client (attaches auth headers, retries once on 401), `ApiError` + narrowing helpers, and the `ApiClientProvider`/`useApiClient` context. |
| `src/assets/` | Static assets bundled by Vite (images, icons, fonts). |

## Prerequisites

- Node.js ≥ 20.11
- pnpm ≥ 9

## Setup

```
cd frontend
cp .env.example .env
pnpm install
```

## Running locally

```
pnpm dev
```

Serves the app at `http://localhost:5173`. The Vite dev server proxies any
request to `/api/*` to the backend at `VITE_API_PROXY_TARGET` (default
`http://localhost:8000`), stripping the `/api` prefix — this is what lets the
frontend call the backend without the backend needing CORS in development.

With the backend running (`cd backend && uvicorn app.main:app --reload`),
verify the proxy end-to-end:

```
curl http://localhost:5173/api/health
# {"status":"ok","database":"ok"}  (or "unreachable" if Postgres isn't running)
```

## Building

```
pnpm build
pnpm preview
```

## Testing

```
pnpm test        # vitest
pnpm typecheck    # tsc -b --noEmit
pnpm lint         # eslint .
```

## Architecture principles

- Features never import from each other (`features/agent` must not import
  from `features/admin`, etc.).
- `shared/` never imports from `features/` or `app/` — shared code stays
  independent of any specific feature or the composition root.
- `app/` is the only place that composes everything: it is the sole
  consumer allowed to import across `features/` and `shared/` to wire
  providers, routing, and configuration together.

See [`docs/architecture.md`](docs/architecture.md) for the theme/design-token
system, localization and RTL, authentication and authorization, the API
client's refresh-on-401 contract, validation, and the loading/empty/error/
success state pattern.

## Known follow-ups

- **CORS.** The backend (`backend/app/`) currently has no CORS middleware.
  The Vite dev proxy sidesteps this locally. A production deployment must
  either add CORS on the backend or serve the SPA from the same origin as
  the API.
- **Backend `/auth/me` permissions.** `UserResponse` doesn't yet expose a
  flat `permissions[]` array, so `features/authentication/api.ts` derives it
  client-side by fetching each role's permissions separately (see the
  `TODO(backend)` there). A follow-up backend story should add
  `permissions[]` directly to `/auth/me`.
