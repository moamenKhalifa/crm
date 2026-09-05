> **Fetched from azure:** [14](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/14)  
> *Fetched 2026-09-03T20:27:24.399Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance Application shell, navigation and language switcher  
**Type:** Issue  
**Status:** To Do

### Description

As a
signed-in user, I want a clear application frame with working navigation, an
obvious account menu and a language switch I can reach at any time, so that I
always know where I am and can work in my own language. 

The current shell shows a broken image
where the logo should be, a text-only sidebar with a weak active state, and an
account control that gives no sign it opens a menu. 

The language switcher exists only on
the sign-in page and disappears once the user is signed in. With Arabic in
scope, that means a user who signs in cannot change language again — and a user
who lands in a language they cannot read has no way out. 

Navigation entries are generated from
the route metadata defined in IA-4, so a user's menu and their actual access
cannot disagree. 

User interface
structure 

Shell 

  ┌ Header
──────────────────────────────────────────────────┐ 

  │ [☰]
[logo] Customer Support CRM      [&#127760;
EN ▾] [ MK ▾ ]  │ 

 
├────────┬─────────────────────────────────────────────────┤ 

  │
Side   │ 
Breadcrumb                                     │ 

  │
nav    │ 
Page title                       
[ Primary ]  │ 

  │        │ 
Content                                        │ 

 
└────────┴─────────────────────────────────────────────────┘ 

   

  Skip to
content is the first focusable element on the page. 

 
Landmarks: banner · navigation · main · contentinfo 

Sidebar 

 
ADMINISTRATION                 
group label, --text-xs, muted 

    &#128100;  Users                     active: tinted surface, a
3px bar on 

    &#128737;   Roles                     the inline-start edge,
weight 500, 

    &#128273;  Permissions               and
aria-current="page" 

   

 
≥1024px   collapsible to icons on
demand, tooltips on hover and focus 

 
<1024px   becomes a drawer
opened by ☰, focus-trapped, closes on 

           
Escape and returns focus to the toggle 

Account menu 

  [ MK
]   Moamen Khalifa   ▾     
avatar with initials fallback, 

          
Administrator            name,
role and a chevron — so it 

                                    reads as a
menu, not a button 

    ├── My
profile 

    ├──
Change password 

    ├──
Language          ▸   English 
|  Arabic 

    └──
Sign out 

Language switcher 

 
Placement   in the header on every
authenticated screen, and on 

             
every public authentication screen 

 
Control     segmented control at
≥768px, menu item below that 

   

 
Labels      each language is
written in its own script: 

             
never translated into the current interface language: 

               
English  is labelled
"English"      in both locales 

               
Arabic   is labelled in Arabic
script in both locales 

             
A user who cannot read the current interface language 

             
must still be able to recognise their own. 

   

 
Current     the active language is
marked visually and with aria-current 

   

 
Behaviour   switching updates
locale and direction with no full page 

             
reload, keeps the user on the same route, preserves unsaved 

             
form input, persists to the user profile when signed in and 

             
to a local preference when not, and is announced 

Header elements and the failure each one prevents 

 
  
   
   Element 

   
   
   Requirement 

   
   
   Failure it prevents 

   
  
 
 
  
  Logo 

  
  
  Versioned SVG asset with a text
  alternative and a text fallback 

  
  
  The broken-image placeholder
  currently in the header 

  
 
 
  
  Product name 

  
  
  Links to the authenticated home 

  
  
  Users with no reliable way back to
  the start 

  
 
 
  
  Account control 

  
  
  Avatar with initials fallback, name,
  and a chevron 

  
  
  A control that reads as a button and
  hides its menu 

  
 
 
  
  Language switcher 

  
  
  Present on every screen, signed in
  or out 

  
  
  Users stranded in a language they
  cannot read 

  
 
 
  
  Skip link 

  
  
  First focusable element on every
  page 

  
  
  Keyboard users tabbing the whole
  navigation on every page 

  
 
 
  
  Breadcrumb 

  
  
  Shown on detail screens 

  
  
  Users losing their place inside
  nested records 

  
   

Notes 

Decisions applied: D-13 (Arabic and RTL), DD-01 (navigation entries the
user cannot reach are hidden entirely), DD-08. 

Concretely: the switcher reads “English” and “العربية” in both locales —
never “Arabic” in the English build or “الإنجليزية” in the Arabic one. 

The language switcher must appear before authentication as well as after
it — a user who cannot read the sign-in page cannot sign in to change the
setting. 

Out of scope for
this story 

Global search across entities 

Notification centre 

Multi-tenant or organisation
switcher 

Onboarding tours 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  The header renders the logo from a versioned asset
with a text alternative, and falls back to the product name if the asset fails
to load rather than showing a broken image. 

AC2  Sidebar entries are generated from route metadata and
filtered by the current user's permissions, so the menu and the user's access
cannot disagree. 

AC3  The active navigation entry is indicated by more than
colour and carries aria-current="page". 

AC4  Sidebar entries carry icons and are grouped under
labelled sections. 

AC5  The sidebar collapses to icons on demand at wide
widths, with tooltips available on hover and on keyboard focus. 

AC6  Below the agreed breakpoint the sidebar becomes a
drawer that traps focus, closes on Escape, and returns focus to the toggle that
opened it. 

AC7  The account control shows an avatar with an initials
fallback, the user's name and a chevron, and opens a menu that is fully
operable by keyboard. 

AC8  A language switcher is present in the header on every
authenticated screen and on every public authentication screen. 

AC9  Each language is labelled in its own script, and the
currently active language is marked both visually and with aria-current. 

AC10  Switching language updates the locale and the document
direction without a full page reload, keeps the user on the same route, and
preserves unsaved form input. 

AC11  The chosen language persists to the user's profile
when signed in and to a local preference when signed out, and is applied on the
next visit. 

AC12  A skip-to-content link is the first focusable element
and moves focus to the main region when activated. 

AC13  The shell exposes banner, navigation, main and
contentinfo landmarks, and the document title updates on every navigation. 

AC14  On route change focus moves to the page heading and
the new page is announced to assistive technology. 

AC15  The entire shell mirrors correctly under RTL, with the
sidebar on the inline-start side and directional icons flipped. 

  

 

G1  The component is built entirely from design tokens; no raw colour, size or spacing value appears in it. 

G2  Every state is implemented and documented: default, hover, focus-visible, active, disabled, loading and error, where each applies. 

G3  The component is fully operable by keyboard with the expected key bindings for its role, and has no keyboard trap. 

G4  The focus indicator is visible, uses the focus token, and is not obscured by sticky headers, footers or overlays. 

G5  The component carries correct roles, names and states for assistive technology, verified with a screen reader rather than assumed from the markup. 

G6  Text meets 4.5:1 contrast, control boundaries and focus indicators meet 3:1, and no information is conveyed by colour alone. 

G7  The component renders correctly under RTL with no component-level direction override, using logical properties throughout. 

G8  All strings come from the message catalogue by key; the component renders correctly with Arabic text, which is typically longer than the English equivalent. 

G9  Motion is reduced or removed under prefers-reduced-motion while every state change remains perceivable. 

G10  The component appears in the living documentation with its props, its states and guidance on when to use it and when not to. 

G11  Automated axe checks pass on the documentation page for the component.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/some-enhancment/14/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `14` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance Application shell, navigation and language switcher
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As a
signed-in user, I want a clear application frame with working navigation, an
obvious account menu and a language switch I can reach at any time, so that I
always know where I am and can work in my own language. 

The current shell shows a broken image
where the logo should be, a text-only sidebar with a weak active state, and an
account control that gives no sign it opens a menu. 

The language switcher exists only on
the sign-in page and disappears once the user is signed in. With Arabic in
scope, that means a user who signs in cannot change language again — and a user
who lands in a language they cannot read has no way out. 

Navigation entries are generated from
the route metadata defined in IA-4, so a user's menu and their actual access
cannot disagree. 

User interface
structure 

Shell 

  ┌ Header
──────────────────────────────────────────────────┐ 

  │ [☰]
[logo] Customer Support CRM      [&#127760;
EN ▾] [ MK ▾ ]  │ 

 
├────────┬─────────────────────────────────────────────────┤ 

  │
Side   │ 
Breadcrumb                                     │ 

  │
nav    │ 
Page title                       
[ Primary ]  │ 

  │        │ 
Content                                        │ 

 
└────────┴─────────────────────────────────────────────────┘ 

   

  Skip to
content is the first focusable element on the page. 

 
Landmarks: banner · navigation · main · contentinfo 

Sidebar 

 
ADMINISTRATION                 
group label, --text-xs, muted 

    &#128100;  Users                     active: tinted surface, a
3px bar on 

    &#128737;   Roles                     the inline-start edge,
weight 500, 

    &#128273;  Permissions               and
aria-current="page" 

   

 
≥1024px   collapsible to icons on
demand, tooltips on hover and focus 

 
<1024px   becomes a drawer
opened by ☰, focus-trapped, closes on 

           
Escape and returns focus to the toggle 

Account menu 

  [ MK
]   Moamen Khalifa   ▾     
avatar with initials fallback, 

          
Administrator            name,
role and a chevron — so it 

                                    reads as a
menu, not a button 

    ├── My
profile 

    ├──
Change password 

    ├──
Language          ▸   English 
|  Arabic 

    └──
Sign out 

Language switcher 

 
Placement   in the header on every
authenticated screen, and on 

             
every public authentication screen 

 
Control     segmented control at
≥768px, menu item below that 

   

 
Labels      each language is
written in its own script: 

             
never translated into the current interface language: 

               
English  is labelled
"English"      in both locales 

               
Arabic   is labelled in Arabic
script in both locales 

             
A user who cannot read the current interface language 

             
must still be able to recognise their own. 

   

 
Current     the active language is
marked visually and with aria-current 

   

 
Behaviour   switching updates
locale and direction with no full page 

             
reload, keeps the user on the same route, preserves unsaved 

             
form input, persists to the user profile when signed in and 

             
to a local preference when not, and is announced 

Header elements and the failure each one prevents 

 
  
   
   Element 

   
   
   Requirement 

   
   
   Failure it prevents 

   
  
 
 
  
  Logo 

  
  
  Versioned SVG asset with a text
  alternative and a text fallback 

  
  
  The broken-image placeholder
  currently in the header 

  
 
 
  
  Product name 

  
  
  Links to the authenticated home 

  
  
  Users with no reliable way back to
  the start 

  
 
 
  
  Account control 

  
  
  Avatar with initials fallback, name,
  and a chevron 

  
  
  A control that reads as a button and
  hides its menu 

  
 
 
  
  Language switcher 

  
  
  Present on every screen, signed in
  or out 

  
  
  Users stranded in a language they
  cannot read 

  
 
 
  
  Skip link 

  
  
  First focusable element on every
  page 

  
  
  Keyboard users tabbing the whole
  navigation on every page 

  
 
 
  
  Breadcrumb 

  
  
  Shown on detail screens 

  
  
  Users losing their place inside
  nested records 

  
   

Notes 

Decisions applied: D-13 (Arabic and RTL), DD-01 (navigation entries the
user cannot reach are hidden entirely), DD-08. 

Concretely: the switcher reads “English” and “العربية” in both locales —
never “Arabic” in the English build or “الإنجليزية” in the Arabic one. 

The language switcher must appear before authentication as well as after
it — a user who cannot read the sign-in page cannot sign in to change the
setting. 

Out of scope for
this story 

Global search across entities 

Notification centre 

Multi-tenant or organisation
switcher 

Onboarding tours 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  The header renders the logo from a versioned asset
with a text alternative, and falls back to the product name if the asset fails
to load rather than showing a broken image. 

AC2  Sidebar entries are generated from route metadata and
filtered by the current user's permissions, so the menu and the user's access
cannot disagree. 

AC3  The active navigation entry is indicated by more than
colour and carries aria-current="page". 

AC4  Sidebar entries carry icons and are grouped under
labelled sections. 

AC5  The sidebar collapses to icons on demand at wide
widths, with tooltips available on hover and on keyboard focus. 

AC6  Below the agreed breakpoint the sidebar becomes a
drawer that traps focus, closes on Escape, and returns focus to the toggle that
opened it. 

AC7  The account control shows an avatar with an initials
fallback, the user's name and a chevron, and opens a menu that is fully
operable by keyboard. 

AC8  A language switcher is present in the header on every
authenticated screen and on every public authentication screen. 

AC9  Each language is labelled in its own script, and the
currently active language is marked both visually and with aria-current. 

AC10  Switching language updates the locale and the document
direction without a full page reload, keeps the user on the same route, and
preserves unsaved form input. 

AC11  The chosen language persists to the user's profile
when signed in and to a local preference when signed out, and is applied on the
next visit. 

AC12  A skip-to-content link is the first focusable element
and moves focus to the main region when activated. 

AC13  The shell exposes banner, navigation, main and
contentinfo landmarks, and the document title updates on every navigation. 

AC14  On route change focus moves to the page heading and
the new page is announced to assistive technology. 

AC15  The entire shell mirrors correctly under RTL, with the
sidebar on the inline-start side and directional icons flipped. 

  

 

G1  The component is built entirely from design tokens; no raw colour, size or spacing value appears in it. 

G2  Every state is implemented and documented: default, hover, focus-visible, active, disabled, loading and error, where each applies. 

G3  The component is fully operable by keyboard with the expected key bindings for its role, and has no keyboard trap. 

G4  The focus indicator is visible, uses the focus token, and is not obscured by sticky headers, footers or overlays. 

G5  The component carries correct roles, names and states for assistive technology, verified with a screen reader rather than assumed from the markup. 

G6  Text meets 4.5:1 contrast, control boundaries and focus indicators meet 3:1, and no information is conveyed by colour alone. 

G7  The component renders correctly under RTL with no component-level direction override, using logical properties throughout. 

G8  All strings come from the message catalogue by key; the component renders correctly with Arabic text, which is typically longer than the English equivalent. 

G9  Motion is reduced or removed under prefers-reduced-motion while every state change remains perceivable. 

G10  The component appears in the living documentation with its props, its states and guidance on when to use it and when not to. 

G11  Automated axe checks pass on the documentation page for the component.
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
