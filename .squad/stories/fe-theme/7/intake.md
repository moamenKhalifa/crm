> **Fetched from azure:** [7](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/7)  
> *Fetched 2026-09-01T13:04:58.723Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance frontend Theme  
**Type:** Issue  
**Status:** To Do

### Description

User Story — Admin UI Visual Polish
("Nimbus Slate" theme) 

As an admin managing users, roles, and
permissions, I want the admin screens to look like a polished,
modern SaaS product instead of an unstyled HTML table, so that the
interface feels trustworthy and is easy to scan at a glance. 

Design direction: Nimbus Slate 

Card-elevated content areas on a soft neutral
background, a blue primary accent reserved for primary actions only, and
consistent color-coded status/role indicators — the same visual language as
Linear/Notion-style admin panels. 

Requirements 

1. Layout & elevation 

 Page
     content sits inside a card
     (surface background, shadows.sm, radii.lg) instead of flush
     against the page background — table, header, and forms currently have zero
     elevation. 

 Header
     gets a subtle bottom border/shadow to separate it from content when
     scrolling. 

 Sidebar
     gets a persistent background (surfaceMuted) distinct from the page, with
     the active route highlighted (background + primary-colored text/icon) —
     right now nothing indicates which section you're in. 

 2. Table 

 Row
     hover state (surfaceMuted background). 

 Header
     row gets a subtle background + bottom border, textMuted color,
     uppercase + letterspaced small text — currently identical weight to body
     rows. 

 Zebra
     striping or at minimum consistent row dividers (border token) instead
     of the current bare-bones spacing. 

 Cell
     padding increased to spacing.md/lg — currently cramped. 

 3. Status & role indicators 

 "Active"/"Inactive"
     already has a Status component with color variants defined —
     actually use success (green) vs neutral (gray)
     consistently; right now every status pill appears to render the same. 

 Role
     badges (admin, etc.) get a distinct info-toned pill background
     instead of plain gray text, so roles are scannable at a glance across a
     row of users. 

 4. Buttons & actions 

 One
     primary action per view max (Create user — already correct).
     Row-level actions (View / Edit / Delete) should
     visually de-emphasize: View/Edit as text links (current) is
     fine, but Delete as a filled red button per-row is too loud for
     a repeated list action — recommend a danger-outline or icon-only
     treatment, reserving the solid danger fill for the
     confirm-dialog's actual destructive button. 

 5. Typography hierarchy 

 Page
     title (Users) needs more visual separation from the table below it —
     increase heading size/weight or add a short muted subtitle (e.g. row
     count). 

 textMuted token
     should be applied to secondary info (email, description columns)
     vs text for primary info (name) — currently everything renders
     the same weight/color. 

 6. Empty & loading states 

 EmptyState/LoadingState components
     already exist (shared/components/feedback) — confirm they're styled with
     icon + centered layout + muted text, not just a bare "Loading…"
     string (per the earlier bug report, this couldn't even be visually
     assessed since it never resolved). 

 7. RTL & dark mode 

 No
     new requirement — ThemeProvider/LocaleProvider already handle
     this; the above must simply respect
     existing data-theme/dir tokens rather than hardcoding values,
     consistent with the rest of the codebase. 

 Out of scope 

 No
     new color palette — reuse existing lightTheme/darkTheme tokens
     in tokens.ts. 

 No
     component library swap (no MUI/Ant/etc.) — refine the existing
     hand-rolled shared/components. 

 No
     layout restructuring (sidebar position, header content) — visual
     refinement only. 

 Acceptance criteria 

  Table
     rows have hover state and clear header/body visual distinction. 

  Sidebar
     highlights the active route. 

  Status
     and role badges use distinct, consistent colors per state. 

  Content
     sits on an elevated card, not flush against the page background. 

  All
     colors/spacing come from existing ThemeTokens — no new hardcoded
     values. 

  Dark
     mode and RTL still render correctly (manual check on /admin/users).

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/fe-theme/7/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `fe-theme`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `7` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance frontend Theme
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
User Story — Admin UI Visual Polish
("Nimbus Slate" theme) 

As an admin managing users, roles, and
permissions, I want the admin screens to look like a polished,
modern SaaS product instead of an unstyled HTML table, so that the
interface feels trustworthy and is easy to scan at a glance. 

Design direction: Nimbus Slate 

Card-elevated content areas on a soft neutral
background, a blue primary accent reserved for primary actions only, and
consistent color-coded status/role indicators — the same visual language as
Linear/Notion-style admin panels. 

Requirements 

1. Layout & elevation 

 Page
     content sits inside a card
     (surface background, shadows.sm, radii.lg) instead of flush
     against the page background — table, header, and forms currently have zero
     elevation. 

 Header
     gets a subtle bottom border/shadow to separate it from content when
     scrolling. 

 Sidebar
     gets a persistent background (surfaceMuted) distinct from the page, with
     the active route highlighted (background + primary-colored text/icon) —
     right now nothing indicates which section you're in. 

 2. Table 

 Row
     hover state (surfaceMuted background). 

 Header
     row gets a subtle background + bottom border, textMuted color,
     uppercase + letterspaced small text — currently identical weight to body
     rows. 

 Zebra
     striping or at minimum consistent row dividers (border token) instead
     of the current bare-bones spacing. 

 Cell
     padding increased to spacing.md/lg — currently cramped. 

 3. Status & role indicators 

 "Active"/"Inactive"
     already has a Status component with color variants defined —
     actually use success (green) vs neutral (gray)
     consistently; right now every status pill appears to render the same. 

 Role
     badges (admin, etc.) get a distinct info-toned pill background
     instead of plain gray text, so roles are scannable at a glance across a
     row of users. 

 4. Buttons & actions 

 One
     primary action per view max (Create user — already correct).
     Row-level actions (View / Edit / Delete) should
     visually de-emphasize: View/Edit as text links (current) is
     fine, but Delete as a filled red button per-row is too loud for
     a repeated list action — recommend a danger-outline or icon-only
     treatment, reserving the solid danger fill for the
     confirm-dialog's actual destructive button. 

 5. Typography hierarchy 

 Page
     title (Users) needs more visual separation from the table below it —
     increase heading size/weight or add a short muted subtitle (e.g. row
     count). 

 textMuted token
     should be applied to secondary info (email, description columns)
     vs text for primary info (name) — currently everything renders
     the same weight/color. 

 6. Empty & loading states 

 EmptyState/LoadingState components
     already exist (shared/components/feedback) — confirm they're styled with
     icon + centered layout + muted text, not just a bare "Loading…"
     string (per the earlier bug report, this couldn't even be visually
     assessed since it never resolved). 

 7. RTL & dark mode 

 No
     new requirement — ThemeProvider/LocaleProvider already handle
     this; the above must simply respect
     existing data-theme/dir tokens rather than hardcoding values,
     consistent with the rest of the codebase. 

 Out of scope 

 No
     new color palette — reuse existing lightTheme/darkTheme tokens
     in tokens.ts. 

 No
     component library swap (no MUI/Ant/etc.) — refine the existing
     hand-rolled shared/components. 

 No
     layout restructuring (sidebar position, header content) — visual
     refinement only. 

 Acceptance criteria 

  Table
     rows have hover state and clear header/body visual distinction. 

  Sidebar
     highlights the active route. 

  Status
     and role badges use distinct, consistent colors per state. 

  Content
     sits on an elevated card, not flush against the page background. 

  All
     colors/spacing come from existing ThemeTokens — no new hardcoded
     values. 

  Dark
     mode and RTL still render correctly (manual check on /admin/users).
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
