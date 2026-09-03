> **Fetched from azure:** [9](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/9)  
> *Fetched 2026-09-02T19:09:45.344Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance Sign in and sign out  
**Type:** Issue  
**Status:** To Do

### Description

As a CRM
user or registered customer, I want to sign in with my email and password and
sign out again, so that I can reach the functionality I am authorised for and
end my session safely on a shared machine. 

Covers the sign-in screen, every
credential failure path, the Remember me behaviour, and sign-out including
cache clearing and multi-tab synchronization. 

Account state is never revealed before
the credentials themselves are correct (D-07), and an unknown email is
indistinguishable from a wrong password (D-06). 

User interface
structure 

Sign-in page — public route /login 

  /login 

  ├──
Locale switcher                    
English | Arabic 

  ├──
Product logo + heading 

  ├── Form 

  │   ├── Email          text,     autocomplete="username" 

  │   ├── Password       password,
autocomplete="current-password", show/hide toggle 

  │   ├── Remember me    checkbox, unchecked by default 

  │   ├── Error banner   role="alert", above the submit
button 

  │   └── [Sign in]      primary, full width, spinner while
submitting 

  ├──
Forgot your password?  →  /forgot-password   (IA-6) 

  └──
Create an account      →  /register          (IA-5) 

Sign-out — authenticated shell 

  Top bar
→ user menu 

  ├── My
profile      → /profile        (IA-9) 

  ├──
Change password → /profile/password (IA-6) 

  └── Sign
out        → confirm not required,
immediate 

Client-side validation 

 
  
   
   Field 

   
   
   Rule 

   
   
   Message key 

   
   
   English message 

   
  
 
 
  
  Email 

  
  
  Required 

  
  
  auth.validation.email.required 

  
  
  Enter your email address 

  
 
 
  
  Email 

  
  
  Valid format 

  
  
  auth.validation.email.invalid 

  
  
  Enter a valid email address 

  
 
 
  
  Password 

  
  
  Required 

  
  
  auth.validation.password.required 

  
  
  Enter your password 

  
   

Server responses 

 
  
   
   Case 

   
   
   Error code 

   
   
   Message key 

   
   
   English message 

   
  
 
 
  
  Wrong password or unknown account 

  
  
  INVALID_CREDENTIALS 

  
  
  auth.login.error.invalidCredentials 

  
  
  Email or password is incorrect 

  
 
 
  
  Deactivated account 

  
  
  ACCOUNT_DISABLED 

  
  
  auth.login.error.accountDisabled 

  
  
  This account has been deactivated.
  Please contact your administrator 

  
 
 
  
  Locked by failed attempts 

  
  
  ACCOUNT_LOCKED 

  
  
  auth.login.error.accountLocked 

  
  
  Too many failed attempts. Try again
  in {countdown} 

  
 
 
  
  Invite not yet accepted 

  
  
  INVITE_PENDING 

  
  
  auth.login.error.invitePending 

  
  
  This account has not been activated
  yet. Check your email for the invitation 

  
 
 
  
  Rate limited 

  
  
  RATE_LIMITED 

  
  
  auth.login.error.rateLimited 

  
  
  Too many attempts. Please wait and
  try again 

  
 
 
  
  Signed out normally 

  
  
  — 

  
  
  auth.login.info.signedOut 

  
  
  You have been signed out 

  
 
 
  
  Network or server failure 

  
  
  — 

  
  
  common.error.unexpected 

  
  
  Something went wrong. Please try
  again. Reference: {correlationId} 

  
   

Notes 

Decisions applied: D-06 (generic sign-in message), D-07 (state revealed
only after correct credentials), D-08 (lockout with countdown), D-09 (Remember
me controls cookie persistence), D-11 (post-sign-in destination), DD-07 (cache
clearing and multi-tab). 

  

  ACCEPTANCE CRITERIA    

AC1  Given the sign-in form, when a required field is left
empty and blurred, then its validation message is shown; thereafter it
validates live as the user types. 

AC2  Given valid credentials, when the user signs in, then
the session is established, user, roles and permissions are loaded, and the
user is routed according to D-11. 

AC3  Given an email that does not exist and an existing
email with the wrong password, when either is submitted, then the same message
is displayed and no observable timing difference distinguishes them. 

AC4  Given correct credentials for a deactivated account,
when submitted, then the deactivated message is shown and no session is
established. 

AC5  Given the account is locked by failed attempts, when
the user submits, then the lockout message shows a live countdown and the
submit button stays disabled until it elapses. 

AC6  Given the account is locked, when the screen is
displayed, then no 'attempts remaining' counter is shown at any point. 

AC7  Given Remember me is unchecked, when the user signs in
and then restarts the browser, then they are signed out. 

AC8  Given Remember me is checked, when the user signs in
and then restarts the browser, then the session is restored for the
refresh-token lifetime. 

AC9  Given the user was redirected from a protected URL,
when they sign in successfully, then they are returned to that URL. 

AC10  Given a return URL that is absolute or
protocol-relative, when sign-in succeeds, then it is ignored and the
role-dependent home is used instead. 

AC11  Given an already authenticated user, when they open
/login, then they are redirected to their home rather than shown the form. 

AC12  Given the form is submitting, when the user clicks
Sign in again or presses Enter, then only one request is issued and the button
shows a spinner while keeping its width. 

AC13  Given a sign-in attempt completes, when the request
has been dispatched, then the password is no longer present in component state
and does not appear in any telemetry payload. 

AC14  Given an authenticated user, when they sign out, then
the backend sign-out is called, authentication state is cleared, the full
server-state cache is cleared, and they are returned to /login with the
signed-out message. 

AC15  Given the user has signed out, when they press the
browser back button, then no protected content is rendered from cache. 

AC16  Given several tabs are open, when the user signs out
in one, then the others are signed out within two seconds. 

AC17  Given a keyboard-only user, when they complete
sign-in, then every control is reachable, errors are announced, and focus moves
to the first invalid field on failure. 

AC18  Given the Arabic locale, when the sign-in page
renders, then the layout is mirrored and the email input remains left-to- 

right
isolated. 

G1  Every form field has a programmatically associated label; a placeholder is never used as the only label. 

 

G2  Validation runs on blur for a field's first pass and live on change thereafter; the submit button is disabled only while submitting, never to indicate invalidity.G3  On a failed submission, a summary is shown at the top of the form, focus moves to the first invalid field, and the summary is announced as a live region. 

 

G4  Field-level errors appear inline beneath their field; anything requiring a decision is an inline banner or dialog, never an auto-dismissing toast.G5  Network and server failures are shown as a retryable banner carrying the correlation ID. 

 

G6  Every screen defines and renders its loading, empty, error and permission-denied states; lists use skeletons matching the final layout rather than a spinner.G7  No user-facing string is hard-coded; every string resolves from the message catalogue by key. 

 

G8  The screen renders correctly in Arabic right-to-left, with mirrored layout and left-to-right isolation for emails, permission codes and numbers.G9  No password or token appears in component state after the request is dispatched, in console output, or in any telemetry payload. 

 

 The screen meets WCAG 2.2 Level AA: keyboard operable throughout, visible and unobscured focus, 4.5:1 text contrast, status never conveyed by colour alone, and interactive targets of at least 24 by 24 pixels

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/some-enhancment/9/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `9` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance Sign in and sign out
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As a CRM
user or registered customer, I want to sign in with my email and password and
sign out again, so that I can reach the functionality I am authorised for and
end my session safely on a shared machine. 

Covers the sign-in screen, every
credential failure path, the Remember me behaviour, and sign-out including
cache clearing and multi-tab synchronization. 

Account state is never revealed before
the credentials themselves are correct (D-07), and an unknown email is
indistinguishable from a wrong password (D-06). 

User interface
structure 

Sign-in page — public route /login 

  /login 

  ├──
Locale switcher                    
English | Arabic 

  ├──
Product logo + heading 

  ├── Form 

  │   ├── Email          text,     autocomplete="username" 

  │   ├── Password       password,
autocomplete="current-password", show/hide toggle 

  │   ├── Remember me    checkbox, unchecked by default 

  │   ├── Error banner   role="alert", above the submit
button 

  │   └── [Sign in]      primary, full width, spinner while
submitting 

  ├──
Forgot your password?  →  /forgot-password   (IA-6) 

  └──
Create an account      →  /register          (IA-5) 

Sign-out — authenticated shell 

  Top bar
→ user menu 

  ├── My
profile      → /profile        (IA-9) 

  ├──
Change password → /profile/password (IA-6) 

  └── Sign
out        → confirm not required,
immediate 

Client-side validation 

 
  
   
   Field 

   
   
   Rule 

   
   
   Message key 

   
   
   English message 

   
  
 
 
  
  Email 

  
  
  Required 

  
  
  auth.validation.email.required 

  
  
  Enter your email address 

  
 
 
  
  Email 

  
  
  Valid format 

  
  
  auth.validation.email.invalid 

  
  
  Enter a valid email address 

  
 
 
  
  Password 

  
  
  Required 

  
  
  auth.validation.password.required 

  
  
  Enter your password 

  
   

Server responses 

 
  
   
   Case 

   
   
   Error code 

   
   
   Message key 

   
   
   English message 

   
  
 
 
  
  Wrong password or unknown account 

  
  
  INVALID_CREDENTIALS 

  
  
  auth.login.error.invalidCredentials 

  
  
  Email or password is incorrect 

  
 
 
  
  Deactivated account 

  
  
  ACCOUNT_DISABLED 

  
  
  auth.login.error.accountDisabled 

  
  
  This account has been deactivated.
  Please contact your administrator 

  
 
 
  
  Locked by failed attempts 

  
  
  ACCOUNT_LOCKED 

  
  
  auth.login.error.accountLocked 

  
  
  Too many failed attempts. Try again
  in {countdown} 

  
 
 
  
  Invite not yet accepted 

  
  
  INVITE_PENDING 

  
  
  auth.login.error.invitePending 

  
  
  This account has not been activated
  yet. Check your email for the invitation 

  
 
 
  
  Rate limited 

  
  
  RATE_LIMITED 

  
  
  auth.login.error.rateLimited 

  
  
  Too many attempts. Please wait and
  try again 

  
 
 
  
  Signed out normally 

  
  
  — 

  
  
  auth.login.info.signedOut 

  
  
  You have been signed out 

  
 
 
  
  Network or server failure 

  
  
  — 

  
  
  common.error.unexpected 

  
  
  Something went wrong. Please try
  again. Reference: {correlationId} 

  
   

Notes 

Decisions applied: D-06 (generic sign-in message), D-07 (state revealed
only after correct credentials), D-08 (lockout with countdown), D-09 (Remember
me controls cookie persistence), D-11 (post-sign-in destination), DD-07 (cache
clearing and multi-tab). 

  

  ACCEPTANCE CRITERIA    

AC1  Given the sign-in form, when a required field is left
empty and blurred, then its validation message is shown; thereafter it
validates live as the user types. 

AC2  Given valid credentials, when the user signs in, then
the session is established, user, roles and permissions are loaded, and the
user is routed according to D-11. 

AC3  Given an email that does not exist and an existing
email with the wrong password, when either is submitted, then the same message
is displayed and no observable timing difference distinguishes them. 

AC4  Given correct credentials for a deactivated account,
when submitted, then the deactivated message is shown and no session is
established. 

AC5  Given the account is locked by failed attempts, when
the user submits, then the lockout message shows a live countdown and the
submit button stays disabled until it elapses. 

AC6  Given the account is locked, when the screen is
displayed, then no 'attempts remaining' counter is shown at any point. 

AC7  Given Remember me is unchecked, when the user signs in
and then restarts the browser, then they are signed out. 

AC8  Given Remember me is checked, when the user signs in
and then restarts the browser, then the session is restored for the
refresh-token lifetime. 

AC9  Given the user was redirected from a protected URL,
when they sign in successfully, then they are returned to that URL. 

AC10  Given a return URL that is absolute or
protocol-relative, when sign-in succeeds, then it is ignored and the
role-dependent home is used instead. 

AC11  Given an already authenticated user, when they open
/login, then they are redirected to their home rather than shown the form. 

AC12  Given the form is submitting, when the user clicks
Sign in again or presses Enter, then only one request is issued and the button
shows a spinner while keeping its width. 

AC13  Given a sign-in attempt completes, when the request
has been dispatched, then the password is no longer present in component state
and does not appear in any telemetry payload. 

AC14  Given an authenticated user, when they sign out, then
the backend sign-out is called, authentication state is cleared, the full
server-state cache is cleared, and they are returned to /login with the
signed-out message. 

AC15  Given the user has signed out, when they press the
browser back button, then no protected content is rendered from cache. 

AC16  Given several tabs are open, when the user signs out
in one, then the others are signed out within two seconds. 

AC17  Given a keyboard-only user, when they complete
sign-in, then every control is reachable, errors are announced, and focus moves
to the first invalid field on failure. 

AC18  Given the Arabic locale, when the sign-in page
renders, then the layout is mirrored and the email input remains left-to- 

right
isolated. 

G1  Every form field has a programmatically associated label; a placeholder is never used as the only label. 

 

G2  Validation runs on blur for a field's first pass and live on change thereafter; the submit button is disabled only while submitting, never to indicate invalidity.G3  On a failed submission, a summary is shown at the top of the form, focus moves to the first invalid field, and the summary is announced as a live region. 

 

G4  Field-level errors appear inline beneath their field; anything requiring a decision is an inline banner or dialog, never an auto-dismissing toast.G5  Network and server failures are shown as a retryable banner carrying the correlation ID. 

 

G6  Every screen defines and renders its loading, empty, error and permission-denied states; lists use skeletons matching the final layout rather than a spinner.G7  No user-facing string is hard-coded; every string resolves from the message catalogue by key. 

 

G8  The screen renders correctly in Arabic right-to-left, with mirrored layout and left-to-right isolation for emails, permission codes and numbers.G9  No password or token appears in component state after the request is dispatched, in console output, or in any telemetry payload. 

 

 The screen meets WCAG 2.2 Level AA: keyboard operable throughout, visible and unobscured focus, 4.5:1 text contrast, status never conveyed by colour alone, and interactive targets of at least 24 by 24 pixels
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
