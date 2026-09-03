> **Fetched from azure:** [12](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/12)  
> *Fetched 2026-09-03T11:40:40.956Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Enhance Form controls and form layout  
**Type:** Issue  
**Status:** To Do

### Description

As a user
filling in a CRM form, I want fields that are a comfortable size, clearly
labelled and helpful when I make a mistake, so that I can complete forms
quickly and correct errors without guessing. 

On the current sign-in screen the
inputs span the entire viewport — roughly 1900 pixels — while the submit button
sits at the opposite edge of the screen from the form it belongs to. The eye
has to travel the full screen width between a label and the end of its field.
Constraining the measure and grouping the form into a centred card is the
single largest visual improvement available anywhere in the product. 

The password visibility toggle
currently sits at the far edge of the field, about as far from the caret as it
is possible to place it. It belongs on the trailing edge of the input, which is
a different physical side in each direction. 

User interface
structure 

Field anatomy 

  Label
*                                  
--text-sm, weight 500 

 
┌────────────────────────────────────┐   
40px tall, --radius-sm, 

  │  control                           │    1px --color-border-input 

 
└────────────────────────────────────┘ 

  Helper
text                              
--text-xs, --color-text-muted 

  ⚠  Error message                          --text-xs,
--color-danger, 

                                           
linked by aria-describedby 

Field width — the rule that fixes the sign-in screen 

 
Authentication card        400px
maximum, centred in the viewport 

 
Single-column form         480px
maximum per field 

 
Two-column layout          only
above 768px, never splitting a related pair 

 
Full-width fields         
textarea and rich text only 

   

  Rule: an
input is never wider than the content it collects. 

        An
email field at 1900px communicates nothing except neglect. 

Authentication screen layout 

  ┌ page —
surface-sunken, content centred both axes ────────┐ 

  │                                                         
│ 

  │            ┌ card — 400px, radius-lg,
shadow-sm ┐        │ 

  │            │ 
[ logo ]                         
│        │ 

  │            │ 
Sign in                --text-2xl
│        │ 

  │            │                                    │        │ 

  │            │ 
Email *                          
│        │ 

  │            │ 
[                             
]  │        │ 

  │            │ 
Password *                       
│        │ 

  │            │ 
[                           &#128065;
]  │        │ 

  │            │ 
[ ] Remember me                  
│        │ 

  │            │ 
[      Sign in — lg, full      ] 
│        │ 

  │            │ 
Forgot your password?            
│        │ 

  │           
└────────────────────────────────────┘        │ 

  │            Create an account                             │ 

 
└──────────────────────────────────────────────────────────┘ 

Controls in the library 

 
TextField · TextArea · PasswordField · Select · Combobox (searchable) 

 
MultiSelect (with chips) · Checkbox · CheckboxGroup · Radio · Switch 

 
DatePicker · SearchField · FormRow · FormSection · FormActions 

Direction-specific behaviour 

  The
visibility toggle sits on the trailing edge of the input — the side 

    the
caret starts from — in both directions, never on a fixed side. 

   

  Checkbox
and radio controls precede their label in reading order, so 

    under
RTL the box sits on the right with the label running leftwards. 

   

  The
required asterisk follows the label text in reading order. 

   

  Email,
phone and code inputs keep dir="ltr" with text-align: start, 

    so the
value reads correctly inside an Arabic form. 

Validation display 

 
  
   
   Situation 

   
   
   Behaviour 

   
   
   Where it appears 

   
   
   Politeness 

   
  
 
 
  
  Field's first pass 

  
  
  Validate on blur 

  
  
  Inline under the field 

  
  
  — 

  
 
 
  
  After first blur or submit 

  
  
  Validate live on change 

  
  
  Inline under the field 

  
  
  — 

  
 
 
  
  Submit with errors 

  
  
  Summary, focus to first invalid
  field 

  
  
  Banner at the top of the form 

  
  
  Assertive 

  
 
 
  
  Server field error 

  
  
  Mapped by field path 

  
  
  Inline under the field 

  
  
  Assertive 

  
 
 
  
  Server form error 

  
  
  Banner with correlation ID 

  
  
  Top of the form 

  
  
  Assertive 

  
 
 
  
  Submitting 

  
  
  Button spinner; fields stay readable 

  
  
  Submit button 

  
  
  — 

  
   

Notes 

Decisions applied: DD-03 (validation timing), DD-04 (error placement),
D-05 (the password policy checklist is fed by the policy endpoint), D-13 (RTL). 

Fields are never disabled during submission — only the submit button is.
Disabling inputs mid-request makes the form appear to have lost the user's
input. 

Out of scope for
this story 

File upload and rich text editing 

Multi-step wizard navigation 

The password policy checklist
content, which is supplied by the backend policy endpoint (D-05) 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  Every control in the library is built from tokens and
documented in all of its states: default, hover, focus, filled, disabled,
read-only and error. 

AC2  Every input has a visible label that is
programmatically associated with it; a placeholder is never used as the only
label. 

AC3  Text inputs are constrained to the documented maximum
width and never stretch to the full viewport width. 

AC4  The authentication screens render as a centred card at
the documented width, with the form, the submit button and the supporting links
all inside it. 

AC5  The password visibility toggle sits inside the field
on its trailing edge in both text directions, and its pressed state is exposed
to assistive technology. 

AC6  Checkbox and radio controls precede their labels in
reading order, so their physical side swaps correctly under RTL. 

AC7  Required fields are marked both visually and
programmatically, and the meaning of the marking is stated once per form. 

AC8  Validation follows the documented timing: on blur for
the first pass, live thereafter, with a summary and a focus move on a failed
submit. 

AC9  Errors are linked to their field with
aria-describedby, the field carries aria-invalid, and the summary is announced
as a live region. 

AC10  Server-returned field errors render against their own
field, and any error whose field path is not recognised falls back to the
form-level banner rather than being dropped. 

AC11  Inputs holding email addresses, phone numbers or codes
render left-to-right inside an Arabic form. 

AC12  Password fields accept pasted text, support
password-manager autofill, and carry the correct autocomplete attributes. 

AC13  An autofilled field keeps the designed appearance
rather than showing the browser's default autofill background. 

AC14  During submission the submit button enters its loading
state while the input fields remain readable and are not disabled. 

AC15  A form with unsaved changes warns the user before
navigation discards them. 

AC16  Every control, including the custom select, combobox
and multi-select, is fully operable by keyboard with the expected key bindings.  

  

 

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

- Folder: `.squad/stories/some-enhancment/12/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `12` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Enhance Form controls and form layout
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As a user
filling in a CRM form, I want fields that are a comfortable size, clearly
labelled and helpful when I make a mistake, so that I can complete forms
quickly and correct errors without guessing. 

On the current sign-in screen the
inputs span the entire viewport — roughly 1900 pixels — while the submit button
sits at the opposite edge of the screen from the form it belongs to. The eye
has to travel the full screen width between a label and the end of its field.
Constraining the measure and grouping the form into a centred card is the
single largest visual improvement available anywhere in the product. 

The password visibility toggle
currently sits at the far edge of the field, about as far from the caret as it
is possible to place it. It belongs on the trailing edge of the input, which is
a different physical side in each direction. 

User interface
structure 

Field anatomy 

  Label
*                                  
--text-sm, weight 500 

 
┌────────────────────────────────────┐   
40px tall, --radius-sm, 

  │  control                           │    1px --color-border-input 

 
└────────────────────────────────────┘ 

  Helper
text                              
--text-xs, --color-text-muted 

  ⚠  Error message                          --text-xs,
--color-danger, 

                                           
linked by aria-describedby 

Field width — the rule that fixes the sign-in screen 

 
Authentication card        400px
maximum, centred in the viewport 

 
Single-column form         480px
maximum per field 

 
Two-column layout          only
above 768px, never splitting a related pair 

 
Full-width fields         
textarea and rich text only 

   

  Rule: an
input is never wider than the content it collects. 

        An
email field at 1900px communicates nothing except neglect. 

Authentication screen layout 

  ┌ page —
surface-sunken, content centred both axes ────────┐ 

  │                                                         
│ 

  │            ┌ card — 400px, radius-lg,
shadow-sm ┐        │ 

  │            │ 
[ logo ]                         
│        │ 

  │            │ 
Sign in                --text-2xl
│        │ 

  │            │                                    │        │ 

  │            │ 
Email *                          
│        │ 

  │            │ 
[                             
]  │        │ 

  │            │ 
Password *                       
│        │ 

  │            │ 
[                           &#128065;
]  │        │ 

  │            │ 
[ ] Remember me                  
│        │ 

  │            │ 
[      Sign in — lg, full      ] 
│        │ 

  │            │ 
Forgot your password?            
│        │ 

  │           
└────────────────────────────────────┘        │ 

  │            Create an account                             │ 

 
└──────────────────────────────────────────────────────────┘ 

Controls in the library 

 
TextField · TextArea · PasswordField · Select · Combobox (searchable) 

 
MultiSelect (with chips) · Checkbox · CheckboxGroup · Radio · Switch 

 
DatePicker · SearchField · FormRow · FormSection · FormActions 

Direction-specific behaviour 

  The
visibility toggle sits on the trailing edge of the input — the side 

    the
caret starts from — in both directions, never on a fixed side. 

   

  Checkbox
and radio controls precede their label in reading order, so 

    under
RTL the box sits on the right with the label running leftwards. 

   

  The
required asterisk follows the label text in reading order. 

   

  Email,
phone and code inputs keep dir="ltr" with text-align: start, 

    so the
value reads correctly inside an Arabic form. 

Validation display 

 
  
   
   Situation 

   
   
   Behaviour 

   
   
   Where it appears 

   
   
   Politeness 

   
  
 
 
  
  Field's first pass 

  
  
  Validate on blur 

  
  
  Inline under the field 

  
  
  — 

  
 
 
  
  After first blur or submit 

  
  
  Validate live on change 

  
  
  Inline under the field 

  
  
  — 

  
 
 
  
  Submit with errors 

  
  
  Summary, focus to first invalid
  field 

  
  
  Banner at the top of the form 

  
  
  Assertive 

  
 
 
  
  Server field error 

  
  
  Mapped by field path 

  
  
  Inline under the field 

  
  
  Assertive 

  
 
 
  
  Server form error 

  
  
  Banner with correlation ID 

  
  
  Top of the form 

  
  
  Assertive 

  
 
 
  
  Submitting 

  
  
  Button spinner; fields stay readable 

  
  
  Submit button 

  
  
  — 

  
   

Notes 

Decisions applied: DD-03 (validation timing), DD-04 (error placement),
D-05 (the password policy checklist is fed by the policy endpoint), D-13 (RTL). 

Fields are never disabled during submission — only the submit button is.
Disabling inputs mid-request makes the form appear to have lost the user's
input. 

Out of scope for
this story 

File upload and rich text editing 

Multi-step wizard navigation 

The password policy checklist
content, which is supplied by the backend policy endpoint (D-05) 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  Every control in the library is built from tokens and
documented in all of its states: default, hover, focus, filled, disabled,
read-only and error. 

AC2  Every input has a visible label that is
programmatically associated with it; a placeholder is never used as the only
label. 

AC3  Text inputs are constrained to the documented maximum
width and never stretch to the full viewport width. 

AC4  The authentication screens render as a centred card at
the documented width, with the form, the submit button and the supporting links
all inside it. 

AC5  The password visibility toggle sits inside the field
on its trailing edge in both text directions, and its pressed state is exposed
to assistive technology. 

AC6  Checkbox and radio controls precede their labels in
reading order, so their physical side swaps correctly under RTL. 

AC7  Required fields are marked both visually and
programmatically, and the meaning of the marking is stated once per form. 

AC8  Validation follows the documented timing: on blur for
the first pass, live thereafter, with a summary and a focus move on a failed
submit. 

AC9  Errors are linked to their field with
aria-describedby, the field carries aria-invalid, and the summary is announced
as a live region. 

AC10  Server-returned field errors render against their own
field, and any error whose field path is not recognised falls back to the
form-level banner rather than being dropped. 

AC11  Inputs holding email addresses, phone numbers or codes
render left-to-right inside an Arabic form. 

AC12  Password fields accept pasted text, support
password-manager autofill, and carry the correct autocomplete attributes. 

AC13  An autofilled field keeps the designed appearance
rather than showing the browser's default autofill background. 

AC14  During submission the submit button enters its loading
state while the input fields remain readable and are not disabled. 

AC15  A form with unsaved changes warns the user before
navigation discards them. 

AC16  Every control, including the custom select, combobox
and multi-select, is fully operable by keyboard with the expected key bindings.  

  

 

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
