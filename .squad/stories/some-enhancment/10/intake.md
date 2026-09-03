> **Fetched from azure:** [10](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/10)  
> *Fetched 2026-09-02T20:13:00.604Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance tokens and theme foundation  
**Type:** Issue  
**Status:** To Do

### Description

As a
designer and frontend developer, I want one set of design tokens and a themed
foundation, so that every screen draws its colour, type, spacing and motion
from a single place instead of ad-hoc values chosen per component. 

The Identity & Access work item
already instructs the team to "use the shared Design System and Frontend
Foundation components". Those components do not exist yet. This epic
builds them, and the Identity & Access stories consume them. 

Tokens are CSS custom properties
arranged in two layers: a raw scale, and semantic aliases on top of it.
Components reference only the semantic layer, so a colour can be re-pointed in
one place rather than found and replaced across the codebase — and so a dark
theme later becomes a second set of alias values rather than a rewrite. 

Every colour pair below has been
checked for contrast. Two values in the first draft failed and were corrected:
the input border was too light to meet the 3:1 requirement for control
boundaries, and disabled text was dimmed below readability. 

User interface
structure 

Token layering — components never touch the raw scale 

  Raw
scale                Semantic alias              Component usage 

 
--blue-600:    #2563EB →
--color-action           → Button/primary
background 

 
--neutral-700: #344054 → --color-text-default     → body copy 

 
--neutral-500: #667085 → --color-text-muted       → helper text, table headers 

 
--neutral-300: #D0D5DD → --color-border-subtle    → dividers only 

   

  A
component that references --blue-600 directly is a defect. 

Spacing, shape, elevation and motion 

 
--space-1 … --space-12    4 8 12
16 20 24 32 40 48 64 px   (4px base grid) 

 
--radius-sm  6px     inputs, chips 

 
--radius-md  8px     buttons, cards 

 
--radius-lg  12px    dialogs, panels 

 
--radius-full        avatars,
pills 

   

 
--shadow-xs   0 1px 2px
rgba(16,24,40,.05)      inputs, chips 

 
--shadow-sm   0 1px 3px
rgba(16,24,40,.10)      cards, table 

 
--shadow-md   0 4px 8px
rgba(16,24,40,.10)      dropdowns,
popovers 

 
--shadow-lg   0 12px 24px
rgba(16,24,40,.12)    dialogs, drawers 

   

 
--duration-fast 150ms   hover,
colour change 

 
--duration-base 200ms   enter /
exit 

 
--ease-out      cubic-bezier(0.2,
0, 0, 1) 

   

 
--focus-ring   2px solid
var(--color-action), 2px offset 

  The
focus ring is never removed, only restyled. 

Direction rules — logical properties only 

  /*
always logical, never physical */ 

 
margin-inline-start   not  margin-left 

 
padding-inline-end    not  padding-right 

 
inset-inline-start    not  left 

 
text-align: start     not  text-align: left 

 
border-start-start-radius …  for
asymmetric corners 

   

  /* icons
that flip under RTL */ 

 
chevron-left / right · arrow-back / forward · undo / redo · indent 

  /* icons
that never flip */ 

  clock ·
checkmark · logo · search · download 

   

  /* LTR
content inside Arabic text is isolated */ 

 
<bdi>{email}</bdi>           
<span dir="ltr">{permissionCode}</span> 

Core palette — every pair below is contrast-verified 

 
  
   
   Semantic token 

   
   
   Value 

   
   
   Used for 

   
   
   Contrast 

   
  
 
 
  
  --color-action 

  
  
  #2563EB 

  
  
  Primary buttons, links, active
  navigation 

  
  
  5.17:1 with white text 

  
 
 
  
  --color-action-hover 

  
  
  #1D4ED8 

  
  
  Hover and pressed states 

  
  
  6.70:1 with white text 

  
 
 
  
  --color-action-subtle 

  
  
  #EFF6FF 

  
  
  Selected rows, info chips, focus
  tint 

  
  
  Background only 

  
 
 
  
  --color-text-strong 

  
  
  #101828 

  
  
  Headings 

  
  
  17.75:1 on white 

  
 
 
  
  --color-text-default 

  
  
  #344054 

  
  
  Body copy, table cells 

  
  
  10.46:1 on white 

  
 
 
  
  --color-text-muted 

  
  
  #667085 

  
  
  Helper text, column headers,
  timestamps 

  
  
  4.97:1 on white 

  
 
 
  
  --color-text-disabled 

  
  
  #667085 on #F2F4F7 

  
  
  Disabled control labels 

  
  
  4.51:1 — disabled but still legible 

  
 
 
  
  --color-border-input 

  
  
  #858FA0 

  
  
  Input, select and checkbox
  boundaries 

  
  
  3.26:1 on white — meets WCAG 1.4.11 

  
 
 
  
  --color-border-subtle 

  
  
  #E4E7EC 

  
  
  Dividers, card edges 

  
  
  Decorative — never a control's only
  boundary 

  
 
 
  
  --color-surface 

  
  
  #FFFFFF 

  
  
  Cards, table body, dialogs 

  
  
  — 

  
 
 
  
  --color-surface-sunken 

  
  
  #F9FAFB 

  
  
  Page background, table header, zebra
  rows 

  
  
  — 

  
 
 
  
  --color-success 

  
  
  #027A48 on #ECFDF3 

  
  
  Active badges, success banners 

  
  
  5.13:1 

  
 
 
  
  --color-warning 

  
  
  #B54708 on #FFFAEB 

  
  
  Pending states, warnings 

  
  
  5.20:1 

  
 
 
  
  --color-danger 

  
  
  #B42318 on #FEF3F2 

  
  
  Error text and banners 

  
  
  6.05:1 

  
 
 
  
  --color-danger-solid 

  
  
  #D92D20 

  
  
  Destructive button background 

  
  
  4.83:1 with white text 

  
   

Type scale — Arabic carries a taller line-height at every
step 

 
  
   
   Token 

   
   
   Latin size / line 

   
   
   Arabic line 

   
   
   Used for 

   
  
 
 
  
  --text-xs 

  
  
  12 / 18 

  
  
  12 / 20 

  
  
  Badges, helper text, table metadata 

  
 
 
  
  --text-sm 

  
  
  14 / 20 

  
  
  14 / 24 

  
  
  Default body, table cells, field
  labels 

  
 
 
  
  --text-base 

  
  
  16 / 24 

  
  
  16 / 28 

  
  
  Form inputs, paragraphs 

  
 
 
  
  --text-lg 

  
  
  18 / 28 

  
  
  18 / 32 

  
  
  Card and dialog titles 

  
 
 
  
  --text-xl 

  
  
  20 / 30 

  
  
  20 / 34 

  
  
  Section headings 

  
 
 
  
  --text-2xl 

  
  
  24 / 32 

  
  
  24 / 38 

  
  
  Page titles 

  
 
 
  
  --text-3xl 

  
  
  30 / 38 

  
  
  30 / 44 

  
  
  Authentication page heading 

  
   

Font families 

 
  
   
   Locale 

   
   
   Family 

   
   
   Fallback chain 

   
   
   Note 

   
  
 
 
  
  English 

  
  
  Inter 

  
  
  system-ui, Segoe UI, sans-serif 

  
  
  Weights 400 / 500 / 600 only 

  
 
 
  
  Arabic 

  
  
  IBM Plex Sans Arabic 

  
  
  Noto Sans Arabic, Tahoma, sans-serif 

  
  
  Arabic reads optically smaller —
  allow a per-locale size adjustment of about 1.05 

  
   

Notes 

Decisions applied: D-13 (Arabic and RTL), DD-08 (WCAG 2.2 AA). 

Arabic line-heights are four pixels taller at every step because the
script has taller ascenders and marks below the baseline; set at Latin
line-height it looks cramped and diacritics clip. 

A dark theme is deliberately out of scope, but the alias layer must be
structured so that adding one is a second set of values rather than a component
rewrite. 

Out of scope for
this story 

Dark theme — the token structure
must allow it later 

Chart and data-visualization
palette — a separate concern with its own accessibility rules 

Icon set production — this story
consumes an icon set, it does not draw one 

Marketing site or email templates 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  Every colour, font size, spacing, radius, shadow and
duration used by a component resolves from a token, and a lint or build check
fails when a raw hex value, pixel font size or pixel spacing appears outside
the token definition file. 

AC2  Semantic aliases sit between the raw scale and the
components, and no component references a raw scale token directly. 

AC3  Every text and background pair in the palette meets at
least 4.5:1, and every control boundary and focus indicator meets at least 3:1,
with the measured values recorded in the documentation. 

AC4  Disabled controls remain legible at 4.5:1; disabled
state is signalled by surface, cursor and border rather than by dimming text
below readability. 

AC5  A visible focus indicator is present on every
interactive element, uses the focus token, is never removed, and is not
obscured by sticky headers, sticky table headers or footers. 

AC6  The type scale defines a separate Arabic line-height
at every step, and Arabic text renders at each of them without clipped
diacritics. 

AC7  The Latin and Arabic font families load per locale
with the documented fallback chain, and font loading does not produce a layout
shift beyond the agreed threshold. 

AC8  All layout styles use CSS logical properties, and a
lint rule or review check flags physical left and right properties. 

AC9  Setting dir="rtl" on the document root
mirrors every component in the library correctly without any component-level
override. 

AC10  Direction-sensitive icons flip under RTL and
direction-neutral icons do not, matching the documented list. 

AC11  When the user has prefers-reduced-motion set,
transitions and animations are reduced or removed while every state change
remains perceivable. 

AC12  The token layer is structured so that introducing a
dark theme requires supplying a second set of semantic alias values and no
component changes. 

AC13  A living documentation page renders every token with
its value, its intended use and its measured contrast, and keeping it current
is part of the definition of done for every later story. 

G1  The component is built entirely from design tokens; no
raw colour, size or spacing value appears in it. 

G2  Every state is implemented and documented: default,
hover, focus-visible, active, disabled, loading and error, where each applies. 

G3  The component is fully operable by keyboard with the
expected key bindings for its role, and has no keyboard trap. 

G4  The focus indicator is visible, uses the focus token,
and is not obscured by sticky headers, footers or overlays. 

G5  The component carries correct roles, names and states
for assistive technology, verified with a screen reader rather than assumed
from the markup. 

G6  Text meets 4.5:1 contrast, control boundaries and
focus indicators meet 3:1, and no information is conveyed by colour alone. 

G7  The component renders correctly under RTL with no
component-level direction override, using logical properties throughout. 

G8  All strings come from the message catalogue by key;
the component renders correctly with Arabic text, which is typically longer
than the English equivalent. 

G9  Motion is reduced or removed under
prefers-reduced-motion while every state change remains perceivable. 

G10  The component appears in the living documentation with
its props, its states and guidance on when to use it and when not to. 

G11  Automated axe checks pass on the documentation page
for the component.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/some-enhancment/10/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `10` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance tokens and theme foundation
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As a
designer and frontend developer, I want one set of design tokens and a themed
foundation, so that every screen draws its colour, type, spacing and motion
from a single place instead of ad-hoc values chosen per component. 

The Identity & Access work item
already instructs the team to "use the shared Design System and Frontend
Foundation components". Those components do not exist yet. This epic
builds them, and the Identity & Access stories consume them. 

Tokens are CSS custom properties
arranged in two layers: a raw scale, and semantic aliases on top of it.
Components reference only the semantic layer, so a colour can be re-pointed in
one place rather than found and replaced across the codebase — and so a dark
theme later becomes a second set of alias values rather than a rewrite. 

Every colour pair below has been
checked for contrast. Two values in the first draft failed and were corrected:
the input border was too light to meet the 3:1 requirement for control
boundaries, and disabled text was dimmed below readability. 

User interface
structure 

Token layering — components never touch the raw scale 

  Raw
scale                Semantic alias              Component usage 

 
--blue-600:    #2563EB →
--color-action           → Button/primary
background 

 
--neutral-700: #344054 → --color-text-default     → body copy 

 
--neutral-500: #667085 → --color-text-muted       → helper text, table headers 

 
--neutral-300: #D0D5DD → --color-border-subtle    → dividers only 

   

  A
component that references --blue-600 directly is a defect. 

Spacing, shape, elevation and motion 

 
--space-1 … --space-12    4 8 12
16 20 24 32 40 48 64 px   (4px base grid) 

 
--radius-sm  6px     inputs, chips 

 
--radius-md  8px     buttons, cards 

 
--radius-lg  12px    dialogs, panels 

 
--radius-full        avatars,
pills 

   

 
--shadow-xs   0 1px 2px
rgba(16,24,40,.05)      inputs, chips 

 
--shadow-sm   0 1px 3px
rgba(16,24,40,.10)      cards, table 

 
--shadow-md   0 4px 8px
rgba(16,24,40,.10)      dropdowns,
popovers 

 
--shadow-lg   0 12px 24px
rgba(16,24,40,.12)    dialogs, drawers 

   

 
--duration-fast 150ms   hover,
colour change 

 
--duration-base 200ms   enter /
exit 

 
--ease-out      cubic-bezier(0.2,
0, 0, 1) 

   

 
--focus-ring   2px solid
var(--color-action), 2px offset 

  The
focus ring is never removed, only restyled. 

Direction rules — logical properties only 

  /*
always logical, never physical */ 

 
margin-inline-start   not  margin-left 

 
padding-inline-end    not  padding-right 

 
inset-inline-start    not  left 

 
text-align: start     not  text-align: left 

 
border-start-start-radius …  for
asymmetric corners 

   

  /* icons
that flip under RTL */ 

 
chevron-left / right · arrow-back / forward · undo / redo · indent 

  /* icons
that never flip */ 

  clock ·
checkmark · logo · search · download 

   

  /* LTR
content inside Arabic text is isolated */ 

 
<bdi>{email}</bdi>           
<span dir="ltr">{permissionCode}</span> 

Core palette — every pair below is contrast-verified 

 
  
   
   Semantic token 

   
   
   Value 

   
   
   Used for 

   
   
   Contrast 

   
  
 
 
  
  --color-action 

  
  
  #2563EB 

  
  
  Primary buttons, links, active
  navigation 

  
  
  5.17:1 with white text 

  
 
 
  
  --color-action-hover 

  
  
  #1D4ED8 

  
  
  Hover and pressed states 

  
  
  6.70:1 with white text 

  
 
 
  
  --color-action-subtle 

  
  
  #EFF6FF 

  
  
  Selected rows, info chips, focus
  tint 

  
  
  Background only 

  
 
 
  
  --color-text-strong 

  
  
  #101828 

  
  
  Headings 

  
  
  17.75:1 on white 

  
 
 
  
  --color-text-default 

  
  
  #344054 

  
  
  Body copy, table cells 

  
  
  10.46:1 on white 

  
 
 
  
  --color-text-muted 

  
  
  #667085 

  
  
  Helper text, column headers,
  timestamps 

  
  
  4.97:1 on white 

  
 
 
  
  --color-text-disabled 

  
  
  #667085 on #F2F4F7 

  
  
  Disabled control labels 

  
  
  4.51:1 — disabled but still legible 

  
 
 
  
  --color-border-input 

  
  
  #858FA0 

  
  
  Input, select and checkbox
  boundaries 

  
  
  3.26:1 on white — meets WCAG 1.4.11 

  
 
 
  
  --color-border-subtle 

  
  
  #E4E7EC 

  
  
  Dividers, card edges 

  
  
  Decorative — never a control's only
  boundary 

  
 
 
  
  --color-surface 

  
  
  #FFFFFF 

  
  
  Cards, table body, dialogs 

  
  
  — 

  
 
 
  
  --color-surface-sunken 

  
  
  #F9FAFB 

  
  
  Page background, table header, zebra
  rows 

  
  
  — 

  
 
 
  
  --color-success 

  
  
  #027A48 on #ECFDF3 

  
  
  Active badges, success banners 

  
  
  5.13:1 

  
 
 
  
  --color-warning 

  
  
  #B54708 on #FFFAEB 

  
  
  Pending states, warnings 

  
  
  5.20:1 

  
 
 
  
  --color-danger 

  
  
  #B42318 on #FEF3F2 

  
  
  Error text and banners 

  
  
  6.05:1 

  
 
 
  
  --color-danger-solid 

  
  
  #D92D20 

  
  
  Destructive button background 

  
  
  4.83:1 with white text 

  
   

Type scale — Arabic carries a taller line-height at every
step 

 
  
   
   Token 

   
   
   Latin size / line 

   
   
   Arabic line 

   
   
   Used for 

   
  
 
 
  
  --text-xs 

  
  
  12 / 18 

  
  
  12 / 20 

  
  
  Badges, helper text, table metadata 

  
 
 
  
  --text-sm 

  
  
  14 / 20 

  
  
  14 / 24 

  
  
  Default body, table cells, field
  labels 

  
 
 
  
  --text-base 

  
  
  16 / 24 

  
  
  16 / 28 

  
  
  Form inputs, paragraphs 

  
 
 
  
  --text-lg 

  
  
  18 / 28 

  
  
  18 / 32 

  
  
  Card and dialog titles 

  
 
 
  
  --text-xl 

  
  
  20 / 30 

  
  
  20 / 34 

  
  
  Section headings 

  
 
 
  
  --text-2xl 

  
  
  24 / 32 

  
  
  24 / 38 

  
  
  Page titles 

  
 
 
  
  --text-3xl 

  
  
  30 / 38 

  
  
  30 / 44 

  
  
  Authentication page heading 

  
   

Font families 

 
  
   
   Locale 

   
   
   Family 

   
   
   Fallback chain 

   
   
   Note 

   
  
 
 
  
  English 

  
  
  Inter 

  
  
  system-ui, Segoe UI, sans-serif 

  
  
  Weights 400 / 500 / 600 only 

  
 
 
  
  Arabic 

  
  
  IBM Plex Sans Arabic 

  
  
  Noto Sans Arabic, Tahoma, sans-serif 

  
  
  Arabic reads optically smaller —
  allow a per-locale size adjustment of about 1.05 

  
   

Notes 

Decisions applied: D-13 (Arabic and RTL), DD-08 (WCAG 2.2 AA). 

Arabic line-heights are four pixels taller at every step because the
script has taller ascenders and marks below the baseline; set at Latin
line-height it looks cramped and diacritics clip. 

A dark theme is deliberately out of scope, but the alias layer must be
structured so that adding one is a second set of values rather than a component
rewrite. 

Out of scope for
this story 

Dark theme — the token structure
must allow it later 

Chart and data-visualization
palette — a separate concern with its own accessibility rules 

Icon set production — this story
consumes an icon set, it does not draw one 

Marketing site or email templates 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  Every colour, font size, spacing, radius, shadow and
duration used by a component resolves from a token, and a lint or build check
fails when a raw hex value, pixel font size or pixel spacing appears outside
the token definition file. 

AC2  Semantic aliases sit between the raw scale and the
components, and no component references a raw scale token directly. 

AC3  Every text and background pair in the palette meets at
least 4.5:1, and every control boundary and focus indicator meets at least 3:1,
with the measured values recorded in the documentation. 

AC4  Disabled controls remain legible at 4.5:1; disabled
state is signalled by surface, cursor and border rather than by dimming text
below readability. 

AC5  A visible focus indicator is present on every
interactive element, uses the focus token, is never removed, and is not
obscured by sticky headers, sticky table headers or footers. 

AC6  The type scale defines a separate Arabic line-height
at every step, and Arabic text renders at each of them without clipped
diacritics. 

AC7  The Latin and Arabic font families load per locale
with the documented fallback chain, and font loading does not produce a layout
shift beyond the agreed threshold. 

AC8  All layout styles use CSS logical properties, and a
lint rule or review check flags physical left and right properties. 

AC9  Setting dir="rtl" on the document root
mirrors every component in the library correctly without any component-level
override. 

AC10  Direction-sensitive icons flip under RTL and
direction-neutral icons do not, matching the documented list. 

AC11  When the user has prefers-reduced-motion set,
transitions and animations are reduced or removed while every state change
remains perceivable. 

AC12  The token layer is structured so that introducing a
dark theme requires supplying a second set of semantic alias values and no
component changes. 

AC13  A living documentation page renders every token with
its value, its intended use and its measured contrast, and keeping it current
is part of the definition of done for every later story. 

G1  The component is built entirely from design tokens; no
raw colour, size or spacing value appears in it. 

G2  Every state is implemented and documented: default,
hover, focus-visible, active, disabled, loading and error, where each applies. 

G3  The component is fully operable by keyboard with the
expected key bindings for its role, and has no keyboard trap. 

G4  The focus indicator is visible, uses the focus token,
and is not obscured by sticky headers, footers or overlays. 

G5  The component carries correct roles, names and states
for assistive technology, verified with a screen reader rather than assumed
from the markup. 

G6  Text meets 4.5:1 contrast, control boundaries and
focus indicators meet 3:1, and no information is conveyed by colour alone. 

G7  The component renders correctly under RTL with no
component-level direction override, using logical properties throughout. 

G8  All strings come from the message catalogue by key;
the component renders correctly with Arabic text, which is typically longer
than the English equivalent. 

G9  Motion is reduced or removed under
prefers-reduced-motion while every state change remains perceivable. 

G10  The component appears in the living documentation with
its props, its states and guidance on when to use it and when not to. 

G11  Automated axe checks pass on the documentation page
for the component.
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
