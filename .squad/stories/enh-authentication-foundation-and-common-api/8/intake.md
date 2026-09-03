> **Fetched from azure:** [8](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/8)  
> *Fetched 2026-09-02T13:32:53.655Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance Authentication foundation and common API layer  
**Type:** Issue  
**Status:** To Do

### Description

Authentication
foundation — API layer, auth context and session bootstrap

As a frontend developer, I want a single authentication and API foundation, so that every feature in the CRM attaches tokens, handles authentication errors and reads the current user in one consistent way instead of reimplementing it per screen.

This story delivers no user-facing screens. It is the substrate that every other story in the epic depends on, and it is separated so the mechanism can be reviewed and unit-tested on its own rather than incidentally through a login form.
Scope: the common API client and its interceptors, in-memory access token handling, the error normalizer and HTTP handling matrix, the authentication context with its tri-state status, the silent bootstrap refresh at application start, and locale/direction bootstrapping.

 

User interface structure
Provider structure at the application root

 

  App root

 

  ├── I18nProvider          locale, direction, message catalogue
  ├── QueryClientProvider   server state / caching

 

  ├── AuthProvider
  │   └── status: unknown | authenticated | anonymous

 

  │       └── while 'unknown' → <AppSplash/>  (neutral, branded, no login form)
  └── RouterProvider

 

Authentication context shape

 

  {
    status:      'unknown' | 'authenticated' | 'anonymous',

 

    user:        { id, fullName, email, emailVerified, locale } | null,
    roles:       string[],

 

    permissions: string[],
    signIn(credentials), signOut(), refresh(), reloadAuthContext()

 

  }
 

 

  The access token is held in a module-scoped variable inside the API layer.
  It is never placed in the context, in component state, or in any storage.

 

Expected backend error envelope

 

  {
    code:          'VALIDATION_FAILED',

 

    message:       'Validation failed',        // fallback text only
    correlationId: '8f2c…',

 

    fieldErrors:   [ { field: 'email', code: 'EMAIL_INVALID', message: '…' } ]
  }

 

HTTP handling matrix
Status	Handling	Where it surfaces	Notes

 

400 / 422	Map fieldErrors to form fields by field path	The calling form, inline per field	Unmapped field paths become a form-level error
401	Attempt refresh (IA-3); on failure hard sign-out	Redirect or re-auth dialog	Never handled by the calling component

 

403	Reload auth context; if still denied, access denied	Access denied page	Covers permissions changed mid-session
404	Not-found state	The calling screen	Not a global error banner

 

409	Conflict / duplicate message	The calling form	e.g. duplicate email
429	Rate-limit message with retry-after	The calling form	Retry-after read from the response

 

5xx / network	Retryable error banner with correlation ID	Page-level banner	Never an auto-dismissing toast

Notes

 

Decisions applied: D-01 (token storage), D-05 (password policy endpoint consumed here), D-13 (locale and direction), DD-04 (error feedback), DD-05 (401/403 handling), DD-06 (tri-state bootstrap).
Backend prerequisites: refresh cookie set on sign-in and refresh and cleared on sign-out; CORS naming the exact frontend origin with credentials allowed; the error envelope above; machine-readable error codes rather than English strings.

 

 
  ACCEPTANCE CRITERIA     

 

AC1  Given the application starts and no session exists, when bootstrap completes, then the authentication status resolves to 'anonymous' and the splash is replaced without any protected content having been rendered.
AC2  Given a valid refresh cookie exists, when the application starts, then exactly one silent refresh is performed, the status resolves to 'authenticated', and user, roles and permissions are populated before any route renders.

 

AC3  Given the authentication status is 'unknown', when any route is evaluated, then no redirect occurs and the splash remains visible.
AC4  Given a request is made to the configured API origin, when it is sent, then the Authorization header carries the current access token.

 

AC5  Given a request is made to any other origin, when it is sent, then no Authorization header is attached.
AC6  Given a request to the sign-in, registration, refresh or password-reset endpoints, when it is sent, then no access token is attached.

 

AC7  Given the backend returns 422 with fieldErrors, when the response is normalized, then each error is returned keyed by its field path and is rendered against that field by the calling form.
AC8  Given the backend returns 5xx or the request fails at the network level, when normalized, then a typed error carrying the correlation ID is produced and displayed as a retryable banner.

 

AC9  Given the backend returns an error code with no entry in the message catalogue, when it is displayed, then the server-supplied message is shown as a fallback and the unknown code is logged for follow-up.
AC10  Given the application starts, when the locale resolves, then the document root carries dir="rtl" for Arabic and dir="ltr" for English before first paint.

 

AC11  Given an error is captured by telemetry, when the payload is assembled, then Authorization headers, password fields and tokens are redacted from it. 
 G1  Every form field has a programmatically associated
label; a placeholder is never used as the only label.

 

 

G2  Validation runs on blur for a field's first pass and
live on change thereafter; the submit button is disabled only while submitting,
never to indicate invalidity.
G3  On a failed submission, a summary is shown at the top
of the form, focus moves to the first invalid field, and the summary is
announced as a live region.

 

 

G4  Field-level errors appear inline beneath their field;
anything requiring a decision is an inline banner or dialog, never an
auto-dismissing toast.
G5  Network and server failures are shown as a retryable
banner carrying the correlation ID.

 

 

G6  Every screen defines and renders its loading, empty,
error and permission-denied states; lists use skeletons matching the final
layout rather than a spinner.
G7  No user-facing string is hard-coded; every string
resolves from the message catalogue by key.

 

 

G8  The screen renders correctly in Arabic right-to-left,
with mirrored layout and left-to-right isolation for emails, permission codes
and numbers.
G9  No password or token appears in component state after
the request is dispatched, in console output, or in any telemetry payload.

 

 

 The screen meets WCAG 2.2 Level AA: keyboard operable
throughout, visible and unobscured focus, 4.5:1 text contrast, status never
conveyed by colour alone, and interactive targets of at least 24 by 24 pixels.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/enh-authentication-foundation-and-common-api/8/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `enh-authentication-foundation-and-common-api`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `8` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance Authentication foundation and common API layer
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
Authentication
foundation — API layer, auth context and session bootstrap

As a frontend developer, I want a single authentication and API foundation, so that every feature in the CRM attaches tokens, handles authentication errors and reads the current user in one consistent way instead of reimplementing it per screen.

This story delivers no user-facing screens. It is the substrate that every other story in the epic depends on, and it is separated so the mechanism can be reviewed and unit-tested on its own rather than incidentally through a login form.
Scope: the common API client and its interceptors, in-memory access token handling, the error normalizer and HTTP handling matrix, the authentication context with its tri-state status, the silent bootstrap refresh at application start, and locale/direction bootstrapping.

 

User interface structure
Provider structure at the application root

 

  App root

 

  ├── I18nProvider          locale, direction, message catalogue
  ├── QueryClientProvider   server state / caching

 

  ├── AuthProvider
  │   └── status: unknown | authenticated | anonymous

 

  │       └── while 'unknown' → <AppSplash/>  (neutral, branded, no login form)
  └── RouterProvider

 

Authentication context shape

 

  {
    status:      'unknown' | 'authenticated' | 'anonymous',

 

    user:        { id, fullName, email, emailVerified, locale } | null,
    roles:       string[],

 

    permissions: string[],
    signIn(credentials), signOut(), refresh(), reloadAuthContext()

 

  }
 

 

  The access token is held in a module-scoped variable inside the API layer.
  It is never placed in the context, in component state, or in any storage.

 

Expected backend error envelope

 

  {
    code:          'VALIDATION_FAILED',

 

    message:       'Validation failed',        // fallback text only
    correlationId: '8f2c…',

 

    fieldErrors:   [ { field: 'email', code: 'EMAIL_INVALID', message: '…' } ]
  }

 

HTTP handling matrix
Status	Handling	Where it surfaces	Notes

 

400 / 422	Map fieldErrors to form fields by field path	The calling form, inline per field	Unmapped field paths become a form-level error
401	Attempt refresh (IA-3); on failure hard sign-out	Redirect or re-auth dialog	Never handled by the calling component

 

403	Reload auth context; if still denied, access denied	Access denied page	Covers permissions changed mid-session
404	Not-found state	The calling screen	Not a global error banner

 

409	Conflict / duplicate message	The calling form	e.g. duplicate email
429	Rate-limit message with retry-after	The calling form	Retry-after read from the response

 

5xx / network	Retryable error banner with correlation ID	Page-level banner	Never an auto-dismissing toast

Notes

 

Decisions applied: D-01 (token storage), D-05 (password policy endpoint consumed here), D-13 (locale and direction), DD-04 (error feedback), DD-05 (401/403 handling), DD-06 (tri-state bootstrap).
Backend prerequisites: refresh cookie set on sign-in and refresh and cleared on sign-out; CORS naming the exact frontend origin with credentials allowed; the error envelope above; machine-readable error codes rather than English strings.

 

 
  ACCEPTANCE CRITERIA     

 

AC1  Given the application starts and no session exists, when bootstrap completes, then the authentication status resolves to 'anonymous' and the splash is replaced without any protected content having been rendered.
AC2  Given a valid refresh cookie exists, when the application starts, then exactly one silent refresh is performed, the status resolves to 'authenticated', and user, roles and permissions are populated before any route renders.

 

AC3  Given the authentication status is 'unknown', when any route is evaluated, then no redirect occurs and the splash remains visible.
AC4  Given a request is made to the configured API origin, when it is sent, then the Authorization header carries the current access token.

 

AC5  Given a request is made to any other origin, when it is sent, then no Authorization header is attached.
AC6  Given a request to the sign-in, registration, refresh or password-reset endpoints, when it is sent, then no access token is attached.

 

AC7  Given the backend returns 422 with fieldErrors, when the response is normalized, then each error is returned keyed by its field path and is rendered against that field by the calling form.
AC8  Given the backend returns 5xx or the request fails at the network level, when normalized, then a typed error carrying the correlation ID is produced and displayed as a retryable banner.

 

AC9  Given the backend returns an error code with no entry in the message catalogue, when it is displayed, then the server-supplied message is shown as a fallback and the unknown code is logged for follow-up.
AC10  Given the application starts, when the locale resolves, then the document root carries dir="rtl" for Arabic and dir="ltr" for English before first paint.

 

AC11  Given an error is captured by telemetry, when the payload is assembled, then Authorization headers, password fields and tokens are redacted from it. 
 G1  Every form field has a programmatically associated
label; a placeholder is never used as the only label.

 

 

G2  Validation runs on blur for a field's first pass and
live on change thereafter; the submit button is disabled only while submitting,
never to indicate invalidity.
G3  On a failed submission, a summary is shown at the top
of the form, focus moves to the first invalid field, and the summary is
announced as a live region.

 

 

G4  Field-level errors appear inline beneath their field;
anything requiring a decision is an inline banner or dialog, never an
auto-dismissing toast.
G5  Network and server failures are shown as a retryable
banner carrying the correlation ID.

 

 

G6  Every screen defines and renders its loading, empty,
error and permission-denied states; lists use skeletons matching the final
layout rather than a spinner.
G7  No user-facing string is hard-coded; every string
resolves from the message catalogue by key.

 

 

G8  The screen renders correctly in Arabic right-to-left,
with mirrored layout and left-to-right isolation for emails, permission codes
and numbers.
G9  No password or token appears in component state after
the request is dispatched, in console output, or in any telemetry payload.

 

 

 The screen meets WCAG 2.2 Level AA: keyboard operable
throughout, visible and unobscured focus, 4.5:1 text contrast, status never
conveyed by colour alone, and interactive targets of at least 24 by 24 pixels.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```

```

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |
| *(e.g. `attachments/flow.png`)* | *(e.g. UX flow)* |

*(Add rows per file. If none, write "None.")*

---

## Dependencies

- **Blocked by / related ids:** (tracker ids only; optional short note)
- **Depends on code areas or other stories:**

## Extra notes (optional)

- Anything not captured above (e.g. chat context) — keep short.

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- What this story explicitly does **not** cover:
