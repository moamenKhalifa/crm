# Story 01 — Align `ApiError` decoding with backend envelope + Customer registration (Story: 5)

## Prerequisites

- None. This is the first story of feature `implement-identity-access-fe` (Azure work item **5**).

---

## Story Goal

Two coupled deliverables that unlock every other story:

1. **Fix the shared `ApiError` decoder** so `error.code` reflects the backend's real domain codes (`invalid_credentials`, `duplicate_account`, `invalid_refresh_token`, …) instead of always falling back to `HTTP_XXX`. Backend returns `{"error":{"code","message"}}` (see `backend/app/modules/identity_access/api/error_handlers.py` lines 30–90); the current decoder in `frontend/src/shared/api/httpClient.ts` (`parseErrorBody`, lines 22–33) reads a **flat** `data.code`/`data.message` and therefore always ends up with `HTTP_401`, `HTTP_409`, etc. This blocks distinguishing "duplicate account" from a generic 409, "invalid credentials" from an expired session, etc.
2. **Add the customer registration page** at route `/register`, wired to `POST /auth/register` and following the design established by the existing `SignInPage`.

Out of scope: creating admin users (that lives in Story 04). Only self-serve customer registration.

---

## Context — Read These Files First

1. `frontend/src/shared/api/httpClient.ts` — read all 122 lines, focus on `parseErrorBody` (lines 22–33) and the 401 refresh path (lines 83–113).
2. `frontend/src/shared/api/ApiError.ts` — read all 48 lines; note `isValidationError` (400/422) and the `code`/`details` fields.
3. `frontend/src/shared/api/ApiError.test.ts` — existing tests for the class, follow their style.
4. `frontend/src/shared/api/httpClient.test.ts` — existing HTTP client tests; the new envelope test will follow the same fetch-mock pattern.
5. `backend/app/modules/identity_access/api/error_handlers.py` lines 30–90 — canonical response body shape `{"error":{"code":"...","message":"..."}}` and the full domain code table (`invalid_credentials`, `duplicate_account`, `expired_refresh_token`, `insufficient_permissions`, `not_found`, `validation_failed`, `duplicate_role`, `duplicate_permission`).
6. `backend/app/modules/identity_access/api/routers/auth.py` lines 38–48 — `POST /auth/register` shape, returns `UserResponse` with 201.
7. `backend/app/modules/identity_access/api/schemas/auth.py` lines 8–11 — `RegisterCustomerRequest`: `email: EmailStr`, `password: str (min_length=8, max_length=128)`, `full_name: str (min_length=1, max_length=200)`.
8. `frontend/src/features/authentication/SignInPage.tsx` — the reference template for the registration page (zod schema + `useForm` + `<EmailInput>` / `<PasswordInput>` / `<Button>` / `<FormError>`).
9. `frontend/src/features/authentication/SignInPage.test.tsx` — mirror this for `RegisterPage.test.tsx`.
10. `frontend/src/features/authentication/api.ts` — where the new `register()` function is added.
11. `frontend/src/features/authentication/AuthProvider.tsx` lines 172–179 — existing `signIn` shape; the new flow will auto-`signIn` after successful registration.
12. `frontend/src/shared/validation/schemas.ts` — `emailSchema`, `passwordSchema` already exist; reuse them.
13. `frontend/src/shared/validation/useForm.ts` — the form hook contract used by `SignInPage`.
14. `frontend/src/app/routing/AppRouter.tsx` lines 24–53 — where the new `/register` public route is added.
15. `frontend/src/shared/i18n/locales/en/common.json` and `frontend/src/shared/i18n/locales/ar/common.json` — add the `auth.register.*` keys.

---

## Implementation tasks

### 1 — Fix `parseErrorBody` to unwrap the backend envelope

File: `frontend/src/shared/api/httpClient.ts`

Rewrite `parseErrorBody` (lines 22–33) so it accepts **either** the enveloped shape (`{"error":{"code","message"}}`, as emitted by `backend/app/modules/identity_access/api/error_handlers.py`) **or** a flat legacy shape, and defensively defaults to `HTTP_<status>` when neither is present.

```ts
async function parseErrorBody(response: Response): Promise<{ code: string; message: string; details?: unknown }> {
  try {
    const data = (await response.json()) as {
      error?: { code?: string; message?: string; details?: unknown };
      code?: string;
      message?: string;
      details?: unknown;
      [key: string]: unknown;
    };
    const envelope = data.error;
    return {
      code: envelope?.code ?? data.code ?? `HTTP_${response.status}`,
      message: envelope?.message ?? data.message ?? response.statusText,
      details: envelope?.details ?? data.details ?? data,
    };
  } catch {
    return { code: `HTTP_${response.status}`, message: response.statusText };
  }
}
```

**Do not** change the surrounding `HttpClient` behaviour. **Do not** log the body. `ApiError.details` is already read by callers and must keep the full raw object for advanced consumers.

### 2 — Extend the `ApiError` helper set

File: `frontend/src/shared/api/ApiError.ts`

Append helpers used by registration and later CRUD stories. Keep the existing helpers untouched.

```ts
export function isConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}
```

Export the new helpers from `frontend/src/shared/api/index.ts` alongside the existing `isApiError`/`isUnauthorized`/etc.

### 3 — Add the `register` API function

File: `frontend/src/features/authentication/api.ts`

After the existing `refresh(...)` (lines 36–38) add:

```ts
export interface RegisterCustomerBody {
  email: string;
  password: string;
  full_name: string;
}

export function register(client: HttpClient, body: RegisterCustomerBody): Promise<UserResponse> {
  return client.post<UserResponse>('/auth/register', body);
}
```

`/auth/register` is public — the existing unauthenticated `authClient` in `AuthProvider` (line 100) is the correct client.

### 4 — Expose `register(...)` via `AuthProvider`

File: `frontend/src/features/authentication/AuthProvider.tsx`

- Import `register` from `./api`.
- Extend `AuthContextValue` (lines 37–46) with `registerCustomer(input: RegisterInput): Promise<void>`. Define `RegisterInput` = `{ email: string; password: string; fullName: string }`.
- Implement `registerCustomer` as a `useCallback` that calls `register(authClient, { email, password, full_name: fullName })`, then immediately calls the existing `signIn({ email, password, rememberMe: false })` so the user is left in an authenticated state (matches "Redirect the user according to the agreed registration/login flow"). If `register` throws, do **not** call `signIn`; rethrow so the form can render the error.
- Add `registerCustomer` to the memoized `value` object (lines 218–229) and to the dependency array (line 228).
- **Security**: never store the raw password in state or refs; only pass it directly to `register`/`signIn` and let it fall out of scope.

Update `frontend/src/features/authentication/AuthProvider.test.tsx` to cover the new method (see Test Plan).

### 5 — Create the registration page

Create file: `frontend/src/features/authentication/RegisterPage.tsx`

Model on `SignInPage.tsx`. Requirements:

- Zod schema using `emailSchema`, `passwordSchema`, plus `fullName` required with `z.string().trim().min(1, 'validation.required').max(200, 'validation.maxLength|200')`.
- Client-side password confirmation via `.superRefine` (or `.refine((v) => v.password === v.passwordConfirm, { path: ['passwordConfirm'], message: 'auth.register.errors.passwordMismatch' })`).
- Fields: **Full name**, **Email**, **Password**, **Confirm password**, using `<TextInput>`, `<EmailInput>`, two `<PasswordInput>` — all from `@shared/components`.
- Submit calls `useAuth().registerCustomer(...)`. On success `navigate('/agent', { replace: true })` (customer default landing — same as `SignInPage`).
- On failure: if `isConflict(error) && hasErrorCode(error, 'duplicate_account')` → `throw new Error('auth.register.errors.duplicateAccount')`; if `isValidationError(error)` → `throw new Error('auth.register.errors.validation')`; else → `throw new Error('errors.unexpected')`. The `useForm` hook (see `frontend/src/shared/validation/useForm.ts` lines 78–87) will place the message in `submitError` for `<FormError>`.
- **Disable the submit button while `isSubmitting`** — `<Button loading={isSubmitting}>` already does this in the existing sign-in page.
- **Do not** `console.log` the values or error under any code path (matches the "Sensitive authentication data must not be logged" requirement).
- Provide a link back to `/sign-in` for existing users.

Create file: `frontend/src/features/authentication/RegisterPage.test.tsx` — mirror `SignInPage.test.tsx`.

### 6 — Add the route

File: `frontend/src/app/routing/AppRouter.tsx`

Between the existing `/sign-in` line (27) and the protected `/agent/*` block (28), insert:

```tsx
const RegisterPage = lazy(() => import('@features/authentication/RegisterPage'));
// ...
{ path: '/register', element: <RegisterPage /> },
```

Import must sit with the other `lazy(...)` imports (lines 7–11).

### 7 — i18n keys

File: `frontend/src/shared/i18n/locales/en/common.json`

Under `auth` (currently ends at line 15) add:

```json
"register": {
  "title": "Create your account",
  "fullName": "Full name",
  "confirmPassword": "Confirm password",
  "submit": "Create account",
  "haveAccount": "Already have an account?",
  "signInLink": "Sign in",
  "errors": {
    "duplicateAccount": "An account with this email already exists.",
    "passwordMismatch": "Passwords do not match.",
    "validation": "Please review the highlighted fields."
  }
}
```

File: `frontend/src/shared/i18n/locales/ar/common.json` — add the same key tree with Arabic translations mirroring the tone of the existing `auth.*` entries.

---

## Edge Cases & Failure Modes

- **Envelope with no body** — response is `text/plain` or empty. `parseErrorBody` still returns `HTTP_<status>` via the `catch` branch (unchanged).
- **Non-JSON error body** — same as above; guarded by `try/catch`.
- **`data.error` present but `code` missing** — falls back to `data.code ?? HTTP_<status>`; test this case.
- **Duplicate email during registration** — backend returns `409` with `code: "duplicate_account"` (see `error_handlers.py` line 42). Registration form maps to `auth.register.errors.duplicateAccount`.
- **Password fails backend `WeakPasswordError`** (422, code `validation_failed`, see `error_handlers.py` line 48) — form maps to `auth.register.errors.validation` and re-renders. Backend remains the authority.
- **Registration succeeds but auto-`signIn` fails** — extremely unlikely (same credentials just used to create the account), but the `registerCustomer` catch path leaves `status` unchanged and rethrows so the user sees `errors.unexpected` and can retry from `/sign-in`.
- **Double-submit** — `useForm.isSubmitting` (see `frontend/src/shared/validation/useForm.ts` line 29) disables the button; also `handleSubmit` early-returns while another submission is in flight because `setIsSubmitting(true)` is guarded by a state check per call — verify by test.
- **Unicode in name / email** — schema accepts unicode; `EmailStr` on the backend validates format.
- **Password never persisted** — `useForm` retains `values` in state, but the registration page must clear the password fields (call `setField('password', '')` / `setField('passwordConfirm', '')`) inside the `try` after successful `registerCustomer`, before navigation.
- **Concurrent refresh across two tabs** — unchanged from foundation; not affected by this story.

---

## Test Plan

1. **Unit — `frontend/src/shared/api/httpClient.test.ts`**: add three cases:
   - Body `{"error":{"code":"duplicate_account","message":"..."}}` → thrown `ApiError.code === 'duplicate_account'` and `error.message === '...'`.
   - Body `{"code":"legacy","message":"..."}` (flat) → still decoded correctly (`code === 'legacy'`).
   - Body `{}` → `code === 'HTTP_<status>'`.
2. **Unit — `frontend/src/shared/api/ApiError.test.ts`**: cover `isConflict`, `hasErrorCode`.
3. **Component — `frontend/src/features/authentication/RegisterPage.test.tsx`** (new):
   - Renders all four fields; submit is disabled while validating empty form.
   - Client validation: mismatching passwords shows `auth.register.errors.passwordMismatch`.
   - Successful submission calls the `POST /auth/register` handler, then navigates to `/agent`. Password fields are cleared before navigation.
   - Duplicate-account (`409` + `code=duplicate_account`) shows `auth.register.errors.duplicateAccount`.
   - Backend validation error (`422` + `code=validation_failed`) shows `auth.register.errors.validation`.
   - Submit button carries `loading` state; a second click while submitting does not fire a second request.
4. **Component — `frontend/src/features/authentication/AuthProvider.test.tsx`**: cover `registerCustomer` happy path (calls register then signIn) and error path (register throws → signIn not called → context still `anonymous`).
5. **Routing — `frontend/src/app/routing/AppRouter.test.tsx`**: assert that `/register` renders the register heading and is reachable while unauthenticated.

---

## Verification Steps

1. **Frontend runs:** in `frontend/` run `pnpm install` (if needed), then `pnpm test`. All new tests plus the existing suites must pass.
2. **Frontend builds:** `pnpm build` in `frontend/`.
3. **Manual smoke:** `pnpm dev` in `frontend/`, backend running from `backend/` (`python run.py`). Visit `/register`, submit a new email → should end up authenticated on `/agent`. Repeat with the same email → inline "account with this email already exists" message. Enter mismatched passwords → inline validation.
4. **Regression:** `pnpm test` — confirm `SignInPage.test.tsx`, `AuthProvider.test.tsx`, `httpClient.test.tsx` all still pass with the new envelope decoder.

---

## Done Criteria

- [ ] `parseErrorBody` unwraps `{"error":{...}}` and passes the existing test suite.
- [ ] `ApiError` exposes `isConflict` and `hasErrorCode`; both re-exported from `@shared/api`.
- [ ] `RegisterPage` renders at `/register`, validates required fields + email + password strength + confirmation.
- [ ] `AuthProvider.registerCustomer` calls `POST /auth/register` then `signIn` and leaves the user authenticated.
- [ ] Duplicate-account 409 shows a specific message; backend validation errors show a generic reviewable message; passwords are never logged and are cleared from form state after success.
- [ ] i18n keys added to both `en` and `ar` locale files.
- [ ] `pnpm test` and `pnpm build` succeed under `frontend/`.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 02.**
