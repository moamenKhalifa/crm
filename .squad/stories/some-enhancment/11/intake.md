> **Fetched from azure:** [11](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/11)  
> *Fetched 2026-09-03T10:17:47.032Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance Button component and action hierarchy patterns  
**Type:** Issue  
**Status:** To Do

### Description

As a user,
I want the actions on every screen to look consistent and to make it obvious
which one is the main one, so that I can act confidently and never trigger
something destructive by mistake. 

On the current users screen the three
row actions carry three different visual weights — View and Edit are plain
underlined text, while Delete is a bordered red button. The destructive action
is therefore the most prominent element in every row of the table. This story
defines the hierarchy that prevents that. 

Buttons are also where the
disabled-with-a-reason pattern from DD-01 lives, since permission-gated
in-context actions are shown disabled rather than hidden. 

User interface
structure 

Variants 

 
primary         solid
--color-action, white label      one per
view 

 
secondary       white surface,
border-input, dark      the common case 

 
tertiary/ghost  transparent, hover
tint                toolbars, table rows 

 
danger          solid
--color-danger-solid            
confirmation dialogs only 

 
danger-subtle   white surface,
danger border + label   destructive
trigger in a row 

 
link            inline, underline
on hover             inside prose only 

Sizes and anatomy 

  sm   32px tall, --text-sm,   12px inline padding    table row actions 

  md   40px tall, --text-sm,   16px inline padding    default 

  lg   48px tall, --text-base, 20px inline
padding    auth forms, full width 

   

 
[icon]  label  [icon]       
icon 16px at sm and md, 20px at lg 

 
Icon-only buttons carry an accessible name and a tooltip, 

  with a
hit target of at least 32 × 32 — above the 24px minimum, 

  because
they appear in dense table rows. 

States 

  default
→ hover → active → focus-visible → loading → disabled 

   

 
loading    spinner replaces the
leading icon, the label stays, 

            
the width is preserved, aria-busy is set, 

            
and the button cannot be submitted again 

 
disabled   surface and border
recede, the label stays legible, 

            
cursor is not-allowed, and a tooltip plus an accessible 

            
description give the reason: 

              
"Requires the User.Delete permission" 

              
"You cannot deactivate your own account" 

Hierarchy rules 

  One
primary action per view. If two feel primary, one of them is not. 

   

  Peer
actions share one variant. Never mix a text link, plain text and a 

   
bordered button for View / Edit / Delete in the same row. 

   

  A
destructive action is never the most prominent element on a screen: 

    in a
table row  →  danger-subtle, or inside an overflow menu 

    in a
dialog     →  the solid danger button, where intent is
explicit 

   

  Dialog
footer order    LTR   [ Cancel ] [ Confirm ] 

                         RTL   [ Confirm ] [ Cancel ] 

    — the
confirming action always sits on the reading-end side. 

Action placement by context 

 
  
   
   Context 

   
   
   Primary 

   
   
   Secondary 

   
   
   Destructive 

   
  
 
 
  
  Page header 

  
  
  One primary button, end-aligned 

  
  
  Ghost, to its start side 

  
  
  Never placed here 

  
 
 
  
  Table row 

  
  
  Not used 

  
  
  Ghost View / Edit 

  
  
  danger-subtle, or overflow menu 

  
 
 
  
  Form footer 

  
  
  Submit, reading-end side 

  
  
  Cancel, beside it 

  
  
  Not placed in a form footer 

  
 
 
  
  Confirmation dialog 

  
  
  Not used 

  
  
  Cancel 

  
  
  Solid danger, reading-end side 

  
 
 
  
  Empty state 

  
  
  One call to action 

  
  
  Optional link 

  
  
  Never placed here 

  
 
 
  
  Detail page header 

  
  
  One primary 

  
  
  Ghost group 

  
  
  danger-subtle, visually separated 

  
   

Notes 

Decisions applied: DD-01 (disable in-context actions with a tooltip
rather than hiding them), DD-10 (destructive action pattern). 

Arabic labels are typically longer than their English equivalents;
buttons must be sized from content rather than fixed widths. 

Out of scope for
this story 

Split buttons and segmented
controls — the language switcher's segmented control is specified in DS-5
Floating action buttons
  ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  All six variants and three sizes are implemented from
tokens and documented with guidance on when each is used. 

AC2  Any single view contains at most one primary button. 

AC3  Peer actions in the same context use the same variant
and size; the current mix of text links and a bordered button for View, Edit
and Delete does not appear anywhere in the product. 

AC4  A destructive action is never rendered as the most
visually prominent element of a list row; it is danger-subtle or lives inside
an overflow menu. 

AC5  The solid danger variant is used only inside a
confirmation dialog. 

AC6  While loading, a button shows a spinner, keeps its
label and its width, is marked aria-busy, and cannot be activated a second
time. 

AC7  A disabled button keeps its label legible and exposes
both a tooltip and an accessible description giving the reason it is disabled. 

AC8  Icon-only buttons have an accessible name and a hit
target of at least 32 by 32 pixels. 

AC9  Focus-visible styling uses the focus token and is
never suppressed on any variant. 

AC10  In a dialog footer the confirming action sits on the
reading-end side in both directions, so the physical order swaps under RTL. 

AC11  Hover and press feedback is present and is reduced or
removed under prefers-reduced-motion. 

AC12  Buttons render correctly with Arabic labels without
truncation or unintended wrapping at the default size. 

The component is built entirely from design tokens; no raw colour, size or spacing value appears in it. 

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

- Folder: `.squad/stories/some-enhancment/11/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `11` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance Button component and action hierarchy patterns
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As a user,
I want the actions on every screen to look consistent and to make it obvious
which one is the main one, so that I can act confidently and never trigger
something destructive by mistake. 

On the current users screen the three
row actions carry three different visual weights — View and Edit are plain
underlined text, while Delete is a bordered red button. The destructive action
is therefore the most prominent element in every row of the table. This story
defines the hierarchy that prevents that. 

Buttons are also where the
disabled-with-a-reason pattern from DD-01 lives, since permission-gated
in-context actions are shown disabled rather than hidden. 

User interface
structure 

Variants 

 
primary         solid
--color-action, white label      one per
view 

 
secondary       white surface,
border-input, dark      the common case 

 
tertiary/ghost  transparent, hover
tint                toolbars, table rows 

 
danger          solid
--color-danger-solid            
confirmation dialogs only 

 
danger-subtle   white surface,
danger border + label   destructive
trigger in a row 

 
link            inline, underline
on hover             inside prose only 

Sizes and anatomy 

  sm   32px tall, --text-sm,   12px inline padding    table row actions 

  md   40px tall, --text-sm,   16px inline padding    default 

  lg   48px tall, --text-base, 20px inline
padding    auth forms, full width 

   

 
[icon]  label  [icon]       
icon 16px at sm and md, 20px at lg 

 
Icon-only buttons carry an accessible name and a tooltip, 

  with a
hit target of at least 32 × 32 — above the 24px minimum, 

  because
they appear in dense table rows. 

States 

  default
→ hover → active → focus-visible → loading → disabled 

   

 
loading    spinner replaces the
leading icon, the label stays, 

            
the width is preserved, aria-busy is set, 

            
and the button cannot be submitted again 

 
disabled   surface and border
recede, the label stays legible, 

            
cursor is not-allowed, and a tooltip plus an accessible 

            
description give the reason: 

              
"Requires the User.Delete permission" 

              
"You cannot deactivate your own account" 

Hierarchy rules 

  One
primary action per view. If two feel primary, one of them is not. 

   

  Peer
actions share one variant. Never mix a text link, plain text and a 

   
bordered button for View / Edit / Delete in the same row. 

   

  A
destructive action is never the most prominent element on a screen: 

    in a
table row  →  danger-subtle, or inside an overflow menu 

    in a
dialog     →  the solid danger button, where intent is
explicit 

   

  Dialog
footer order    LTR   [ Cancel ] [ Confirm ] 

                         RTL   [ Confirm ] [ Cancel ] 

    — the
confirming action always sits on the reading-end side. 

Action placement by context 

 
  
   
   Context 

   
   
   Primary 

   
   
   Secondary 

   
   
   Destructive 

   
  
 
 
  
  Page header 

  
  
  One primary button, end-aligned 

  
  
  Ghost, to its start side 

  
  
  Never placed here 

  
 
 
  
  Table row 

  
  
  Not used 

  
  
  Ghost View / Edit 

  
  
  danger-subtle, or overflow menu 

  
 
 
  
  Form footer 

  
  
  Submit, reading-end side 

  
  
  Cancel, beside it 

  
  
  Not placed in a form footer 

  
 
 
  
  Confirmation dialog 

  
  
  Not used 

  
  
  Cancel 

  
  
  Solid danger, reading-end side 

  
 
 
  
  Empty state 

  
  
  One call to action 

  
  
  Optional link 

  
  
  Never placed here 

  
 
 
  
  Detail page header 

  
  
  One primary 

  
  
  Ghost group 

  
  
  danger-subtle, visually separated 

  
   

Notes 

Decisions applied: DD-01 (disable in-context actions with a tooltip
rather than hiding them), DD-10 (destructive action pattern). 

Arabic labels are typically longer than their English equivalents;
buttons must be sized from content rather than fixed widths. 

Out of scope for
this story 

Split buttons and segmented
controls — the language switcher's segmented control is specified in DS-5
Floating action buttons
  ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  All six variants and three sizes are implemented from
tokens and documented with guidance on when each is used. 

AC2  Any single view contains at most one primary button. 

AC3  Peer actions in the same context use the same variant
and size; the current mix of text links and a bordered button for View, Edit
and Delete does not appear anywhere in the product. 

AC4  A destructive action is never rendered as the most
visually prominent element of a list row; it is danger-subtle or lives inside
an overflow menu. 

AC5  The solid danger variant is used only inside a
confirmation dialog. 

AC6  While loading, a button shows a spinner, keeps its
label and its width, is marked aria-busy, and cannot be activated a second
time. 

AC7  A disabled button keeps its label legible and exposes
both a tooltip and an accessible description giving the reason it is disabled. 

AC8  Icon-only buttons have an accessible name and a hit
target of at least 32 by 32 pixels. 

AC9  Focus-visible styling uses the focus token and is
never suppressed on any variant. 

AC10  In a dialog footer the confirming action sits on the
reading-end side in both directions, so the physical order swaps under RTL. 

AC11  Hover and press feedback is present and is reduced or
removed under prefers-reduced-motion. 

AC12  Buttons render correctly with Arabic labels without
truncation or unintended wrapping at the default size. 

The component is built entirely from design tokens; no raw colour, size or spacing value appears in it. 

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
