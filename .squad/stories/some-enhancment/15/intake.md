> **Fetched from azure:** [15](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/15)  
> *Fetched 2026-09-04T04:20:29.698Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance Feedback, status and page-state components  
**Type:** Issue  
**Status:** To Do

### Description

As a user,
I want consistent and well-placed feedback when something succeeds, fails or is
still loading, so that I always know what happened and what to do next. 

Feedback conventions are currently
undefined, so each screen will invent its own and errors that need action will
disappear after four seconds. The rules agreed in DD-04 are implemented here as
components, which is what turns them from an aspiration into something a
reviewer can check. 

The role chips on the current users
screen are inconsistently cased and use two colours with no defined meaning.
Colour that carries no rule is noise; the chip component fixes the rule and the
data is normalised at its source. 

User interface
structure 

Which component carries which message 

 
Transient success            
Toast — 4s, dismissible, polite 

  Success
needing a next step   Inline banner with
a link, stays until dismissed 

 
Recoverable error            
Inline banner with Retry and a correlation ID 

 
Validation summary           
Banner at the top of the form, assertive 

  Blocking
decision             Modal dialog 

 
Irreversible action          
Confirmation dialog stating the real consequence 

 
Background progress          
Inline progress with a label, never a blocking spinner 

   

  Rule:
never use an auto-dismissing toast for anything that requires a 

       
decision, or that the user may need to read a second time. 

Status badge — never colour alone 

  ●  Active     
success tint     dot + label 

  ●  Inactive   
neutral tint     dot + label 

  ●  Pending    
warning tint     dot + label 

   

  The
label is always present. A colour-blind user, a greyscale print 

  and a
screen reader must all be able to read the state. 

Page states 

 
EmptyState       icon, heading,
one sentence, one action 

 
FilteredEmpty    heading, the
filters in force, Clear filters 

 
ErrorState       heading,
plain-language cause, Retry, correlation ID 

 
LoadingState     skeletons shaped
like the content, minimum 300ms 

 
NotFound         heading,
explanation, route back 

 
AccessDenied     heading, what to
ask for, route back      (used by IA-4) 

Chip and badge colour rules 

 
  
   
   Use 

   
   
   Colour 

   
   
   Rule 

   
   
   Example 

   
  
 
 
  
  Status 

  
  
  Semantic 

  
  
  Colour maps to a documented state 

  
  
  Active, Inactive, Pending invite 

  
 
 
  
  Role 

  
  
  Neutral by default 

  
  
  An accent only where it carries
  documented meaning 

  
  
  admin, Manager 

  
 
 
  
  Count / metadata 

  
  
  Neutral 

  
  
  Never semantic 

  
  
  3 roles 

  
 
 
  
  Casing 

  
  
  — 

  
  
  Rendered as stored; names are
  normalised at the source rather than styled around 

  
  
  admin vs Manager today 

  
   

Notes 

Decisions applied: DD-04 (error and feedback placement), DD-10
(destructive confirmation), DD-08. 

The inconsistent casing of role chips is a data problem surfacing as a
visual one. The fix belongs in role naming, not in a text-transform in the chip
component. 

Out of scope for
this story 

Notification centre and persistent
notification history 

In-product messaging or
announcement banners 

Onboarding tooltips and product
tours 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  Each feedback component exists once in the library,
and the documented mapping of message type to component is followed everywhere
in the product. 

AC2  No auto-dismissing toast is used for a message that
requires a decision or that the user may need to re-read. 

AC3  Toasts are announced politely, are dismissible, pause
their timer on hover and on focus, and stack without covering the primary
action of the page. 

AC4  Error banners offer a retry action wherever retrying
is possible, and display the correlation ID for support. 

AC5  Confirmation dialogs state the consequence using real
data rather than generic wording, and irreversible actions require a typed
confirmation. 

AC6  Dialogs trap focus, close on Escape, return focus to
their trigger, and are labelled by their heading. 

AC7  Status is always conveyed by text or an icon in
addition to colour, and every status colour pair meets the contrast
requirement. 

AC8  Chip colours are used only where the colour carries
documented meaning; all other chips are neutral. 

AC9  Every list and detail screen implements its empty,
filtered-empty, error and loading states from these components rather than
ad-hoc markup. 

AC10  Skeletons match the shape of the content they replace
and are displayed for a minimum duration so that a fast response does not
produce a flicker. 

AC11  Live regions use the correct politeness: assertive for
validation failures, polite for background success. 

AC12  All feedback components render correctly under RTL,
including the direction a toast enters from and the order of dialog  footer
buttons. 

  

 

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

- Folder: `.squad/stories/some-enhancment/15/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `15` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance Feedback, status and page-state components
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As a user,
I want consistent and well-placed feedback when something succeeds, fails or is
still loading, so that I always know what happened and what to do next. 

Feedback conventions are currently
undefined, so each screen will invent its own and errors that need action will
disappear after four seconds. The rules agreed in DD-04 are implemented here as
components, which is what turns them from an aspiration into something a
reviewer can check. 

The role chips on the current users
screen are inconsistently cased and use two colours with no defined meaning.
Colour that carries no rule is noise; the chip component fixes the rule and the
data is normalised at its source. 

User interface
structure 

Which component carries which message 

 
Transient success            
Toast — 4s, dismissible, polite 

  Success
needing a next step   Inline banner with
a link, stays until dismissed 

 
Recoverable error            
Inline banner with Retry and a correlation ID 

 
Validation summary           
Banner at the top of the form, assertive 

  Blocking
decision             Modal dialog 

 
Irreversible action          
Confirmation dialog stating the real consequence 

 
Background progress          
Inline progress with a label, never a blocking spinner 

   

  Rule:
never use an auto-dismissing toast for anything that requires a 

       
decision, or that the user may need to read a second time. 

Status badge — never colour alone 

  ●  Active     
success tint     dot + label 

  ●  Inactive   
neutral tint     dot + label 

  ●  Pending    
warning tint     dot + label 

   

  The
label is always present. A colour-blind user, a greyscale print 

  and a
screen reader must all be able to read the state. 

Page states 

 
EmptyState       icon, heading,
one sentence, one action 

 
FilteredEmpty    heading, the
filters in force, Clear filters 

 
ErrorState       heading,
plain-language cause, Retry, correlation ID 

 
LoadingState     skeletons shaped
like the content, minimum 300ms 

 
NotFound         heading,
explanation, route back 

 
AccessDenied     heading, what to
ask for, route back      (used by IA-4) 

Chip and badge colour rules 

 
  
   
   Use 

   
   
   Colour 

   
   
   Rule 

   
   
   Example 

   
  
 
 
  
  Status 

  
  
  Semantic 

  
  
  Colour maps to a documented state 

  
  
  Active, Inactive, Pending invite 

  
 
 
  
  Role 

  
  
  Neutral by default 

  
  
  An accent only where it carries
  documented meaning 

  
  
  admin, Manager 

  
 
 
  
  Count / metadata 

  
  
  Neutral 

  
  
  Never semantic 

  
  
  3 roles 

  
 
 
  
  Casing 

  
  
  — 

  
  
  Rendered as stored; names are
  normalised at the source rather than styled around 

  
  
  admin vs Manager today 

  
   

Notes 

Decisions applied: DD-04 (error and feedback placement), DD-10
(destructive confirmation), DD-08. 

The inconsistent casing of role chips is a data problem surfacing as a
visual one. The fix belongs in role naming, not in a text-transform in the chip
component. 

Out of scope for
this story 

Notification centre and persistent
notification history 

In-product messaging or
announcement banners 

Onboarding tooltips and product
tours 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  Each feedback component exists once in the library,
and the documented mapping of message type to component is followed everywhere
in the product. 

AC2  No auto-dismissing toast is used for a message that
requires a decision or that the user may need to re-read. 

AC3  Toasts are announced politely, are dismissible, pause
their timer on hover and on focus, and stack without covering the primary
action of the page. 

AC4  Error banners offer a retry action wherever retrying
is possible, and display the correlation ID for support. 

AC5  Confirmation dialogs state the consequence using real
data rather than generic wording, and irreversible actions require a typed
confirmation. 

AC6  Dialogs trap focus, close on Escape, return focus to
their trigger, and are labelled by their heading. 

AC7  Status is always conveyed by text or an icon in
addition to colour, and every status colour pair meets the contrast
requirement. 

AC8  Chip colours are used only where the colour carries
documented meaning; all other chips are neutral. 

AC9  Every list and detail screen implements its empty,
filtered-empty, error and loading states from these components rather than
ad-hoc markup. 

AC10  Skeletons match the shape of the content they replace
and are displayed for a minimum duration so that a fast response does not
produce a flicker. 

AC11  Live regions use the correct politeness: assertive for
validation failures, polite for background success. 

AC12  All feedback components render correctly under RTL,
including the direction a toast enters from and the order of dialog  footer
buttons. 

  

 

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
