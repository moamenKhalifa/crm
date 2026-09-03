> **Fetched from azure:** [13](https://dev.azure.com/moamenkhalifa0584/Customer%20Support%20CRM/_workitems/edit/13)  
> *Fetched 2026-09-03T13:57:29.461Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** Reusable data table  
**Type:** Issue  
**Status:** To Do

### Description

As an
administrator working through lists of users, roles and permissions, I want one
consistent table with search, sorting, paging and clear row actions, so that I
can find and act on records quickly whether there are seven of them or seven
thousand. 

The current users table has no search,
no filters, no sortable headers and no page-size control, and its pagination is
a bare "1 / 1". At seven users none of this is visible as a problem.
The module is specified for server-side paging precisely because it will not
stay at seven. 

This is the most reused component in
the product. Every administration screen in Identity & Access depends on
it, and so will every list built after it — which is why it is the largest
story in this epic and why its API is specified here rather than discovered per
screen. 

User interface
structure 

Component API 

 
<DataTable 

   
columns={[ 

      {
key:'fullName',  
labelKey:'users.col.name',  
sortable:true }, 

      {
key:'email',     
labelKey:'users.col.email', 
sortable:true, dir:'ltr' }, 

      {
key:'status',    
labelKey:'users.col.status', render: StatusBadge }, 

      {
key:'lastSignIn', labelKey:'users.col.lastSeen', render: DateTime, align:'end'
}, 

    ]} 

   
rows={data} 
rowKey="id" 
totalCount={total} 

   
state={tableState}          //
page, pageSize, sort, query, filters 

   
onStateChange={syncToUrl}   // one
source of truth, mirrored in the URL 

   
isLoading  isError  onRetry 

   
emptyState={<EmptyState … />} 

   
rowActions={(row) => [ … ]} 

   
density="comfortable | compact" 

  /> 

Anatomy 

  ┌
Toolbar ─────────────────────────────────────────────────┐ 

  │  [ search…            ] 
[ Status ▾ ] [ Role ▾ ]  [ + ]  │ 

  │  312 users · 2 filters applied · Clear
all               │ 

  ├ Table
───────────────────────────────────────────────────┤ 

  │  HEADER — sticky, sortable ↑↓, aria-sort                 │ 

  │  row                                                    
│ 

  │  row                              actions on the
end side│ 

  │  row                                                    
│ 

  ├ Footer
──────────────────────────────────────────────────┤ 

  │  Showing 1–25 of 312     Rows: [ 25 ▾ ]   ‹ 1 2 3 … 13 › │ 

 
└──────────────────────────────────────────────────────────┘ 

States 

 
loading    skeleton rows matching
the real column widths, 

            
header visible, no spinner over the table 

 
empty      "No users
yet"                      + primary
action 

 
filtered   "No users match
these filters"      + Clear filters 

 
error      inline error row with
Retry; the toolbar stays usable 

            
and the current filters are not lost 

 
partial    the previous page stays
visible and dimmed while the 

            
next one loads, so the layout does not collapse 

Small screens — below 768px each row becomes a card 

 
┌────────────────────────────────────┐ 

  │  PG Test                 ● Active  │ 

  │  pgtest@example.com                │ 

  │  Roles: admin                      │ 

  │  [ View ] 
[ Edit ]           [⋯]  │ 

 
└────────────────────────────────────┘ 

URL state contract — makes any view shareable and
restorable 

 
  
   
   Parameter 

   
   
   Example 

   
   
   Behaviour 

   
   
   Notes 

   
  
 
 
  
  q 

  
  
  ?q=khalifa 

  
  
  Free-text search 

  
  
  Debounced ~300ms, ignored below 2
  characters 

  
 
 
  
  page 

  
  
  ?page=3 

  
  
  Current page 

  
  
  1-based; resets to 1 when a filter
  changes 

  
 
 
  
  pageSize 

  
  
  ?pageSize=25 

  
  
  Rows per page 

  
  
  From the allowed set 10 / 25 / 50 /
  100 

  
 
 
  
  sort 

  
  
  ?sort=email:asc 

  
  
  Sort column and direction 

  
  
  Single column in the first version 

  
 
 
  
  Filters 

  
  
  ?status=active&role=admin 

  
  
  Column filters 

  
  
  Repeatable keys for multi-value
  filters 

  
   

Notes 

Decisions applied: D-14 (server-side paging, sorting and filtering;
default page size 25), DD-01 (permission-gated row actions disabled with a
reason), DD-09 (table conventions). 

Row actions beyond three move into an overflow menu. Five visible actions
per row turn a table into a wall of controls and make the destructive one easy
to hit by accident. 

Out of scope for
this story 

Multi-column sorting — single
column in the first version 

Column reordering, resizing and
show/hide preferences 

Inline cell editing 

CSV export 

Virtualised infinite scrolling —
paging is the agreed pattern 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  One DataTable component serves the users, roles and
permissions lists, and no screen implements its own table markup. 

AC2  Paging, sorting, filtering and search are performed
server-side, and the component never requests the full collection in order to
filter it locally. 

AC3  Search is debounced at approximately 300 milliseconds
and is not sent below two characters. 

AC4  Sortable headers expose aria-sort, are operable by
keyboard, and indicate the current sort direction visually as well as
programmatically. 

AC5  Page, page size, sort, search and filters are
reflected in the URL query string, so a refresh, a back navigation or a shared
link restores exactly the same view. 

AC6  Changing a filter resets the page to the first page
rather than leaving the user on an out-of-range page. 

AC7  The footer states the visible range and the total
count, and the page-size control offers the documented set of options. 

AC8  While loading, skeleton rows matching the real column
widths are shown with the header visible. 

AC9  The empty, filtered-empty and error states are
visually and textually distinct, and the filtered-empty state offers a
clear-filters action. 

AC10  The error state keeps the toolbar usable and offers a
retry that preserves the current filters. 

AC11  Row actions all use one variant and size; where a row
has more than three actions, the surplus moves into an overflow menu. 

AC12  A row action the user lacks permission for is disabled
with a tooltip giving the reason, and is never rendered as an enabled control. 

AC13  Below the agreed breakpoint each row renders as a card
carrying the same data and the same actions. 

AC14  The component uses real table semantics with an
accessible name, and each row action has an accessible name that identifies its
row rather than repeating a bare verb. 

AC15  After a row is removed, focus moves to a sensible
neighbouring element rather than to the document body. 

AC16  The sticky header never obscures the focus indicator
of focusable content within a row. 

AC17  Under RTL the column order, sort indicators and
pagination controls mirror, while email addresses, permission codes and numeric
identifiers remain left-to-right. 

AC18  Date
columns render in the user's locale and timezone, with the absolute value
available on hover.
 

  

 

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

- Folder: `.squad/stories/some-enhancment/13/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `some-enhancment`

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `13` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Issue`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Reusable data table
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an
administrator working through lists of users, roles and permissions, I want one
consistent table with search, sorting, paging and clear row actions, so that I
can find and act on records quickly whether there are seven of them or seven
thousand. 

The current users table has no search,
no filters, no sortable headers and no page-size control, and its pagination is
a bare "1 / 1". At seven users none of this is visible as a problem.
The module is specified for server-side paging precisely because it will not
stay at seven. 

This is the most reused component in
the product. Every administration screen in Identity & Access depends on
it, and so will every list built after it — which is why it is the largest
story in this epic and why its API is specified here rather than discovered per
screen. 

User interface
structure 

Component API 

 
<DataTable 

   
columns={[ 

      {
key:'fullName',  
labelKey:'users.col.name',  
sortable:true }, 

      {
key:'email',     
labelKey:'users.col.email', 
sortable:true, dir:'ltr' }, 

      {
key:'status',    
labelKey:'users.col.status', render: StatusBadge }, 

      {
key:'lastSignIn', labelKey:'users.col.lastSeen', render: DateTime, align:'end'
}, 

    ]} 

   
rows={data} 
rowKey="id" 
totalCount={total} 

   
state={tableState}          //
page, pageSize, sort, query, filters 

   
onStateChange={syncToUrl}   // one
source of truth, mirrored in the URL 

   
isLoading  isError  onRetry 

   
emptyState={<EmptyState … />} 

   
rowActions={(row) => [ … ]} 

   
density="comfortable | compact" 

  /> 

Anatomy 

  ┌
Toolbar ─────────────────────────────────────────────────┐ 

  │  [ search…            ] 
[ Status ▾ ] [ Role ▾ ]  [ + ]  │ 

  │  312 users · 2 filters applied · Clear
all               │ 

  ├ Table
───────────────────────────────────────────────────┤ 

  │  HEADER — sticky, sortable ↑↓, aria-sort                 │ 

  │  row                                                    
│ 

  │  row                              actions on the
end side│ 

  │  row                                                    
│ 

  ├ Footer
──────────────────────────────────────────────────┤ 

  │  Showing 1–25 of 312     Rows: [ 25 ▾ ]   ‹ 1 2 3 … 13 › │ 

 
└──────────────────────────────────────────────────────────┘ 

States 

 
loading    skeleton rows matching
the real column widths, 

            
header visible, no spinner over the table 

 
empty      "No users
yet"                      + primary
action 

 
filtered   "No users match
these filters"      + Clear filters 

 
error      inline error row with
Retry; the toolbar stays usable 

            
and the current filters are not lost 

 
partial    the previous page stays
visible and dimmed while the 

            
next one loads, so the layout does not collapse 

Small screens — below 768px each row becomes a card 

 
┌────────────────────────────────────┐ 

  │  PG Test                 ● Active  │ 

  │  pgtest@example.com                │ 

  │  Roles: admin                      │ 

  │  [ View ] 
[ Edit ]           [⋯]  │ 

 
└────────────────────────────────────┘ 

URL state contract — makes any view shareable and
restorable 

 
  
   
   Parameter 

   
   
   Example 

   
   
   Behaviour 

   
   
   Notes 

   
  
 
 
  
  q 

  
  
  ?q=khalifa 

  
  
  Free-text search 

  
  
  Debounced ~300ms, ignored below 2
  characters 

  
 
 
  
  page 

  
  
  ?page=3 

  
  
  Current page 

  
  
  1-based; resets to 1 when a filter
  changes 

  
 
 
  
  pageSize 

  
  
  ?pageSize=25 

  
  
  Rows per page 

  
  
  From the allowed set 10 / 25 / 50 /
  100 

  
 
 
  
  sort 

  
  
  ?sort=email:asc 

  
  
  Sort column and direction 

  
  
  Single column in the first version 

  
 
 
  
  Filters 

  
  
  ?status=active&role=admin 

  
  
  Column filters 

  
  
  Repeatable keys for multi-value
  filters 

  
   

Notes 

Decisions applied: D-14 (server-side paging, sorting and filtering;
default page size 25), DD-01 (permission-gated row actions disabled with a
reason), DD-09 (table conventions). 

Row actions beyond three move into an overflow menu. Five visible actions
per row turn a table into a wall of controls and make the destructive one easy
to hit by accident. 

Out of scope for
this story 

Multi-column sorting — single
column in the first version 

Column reordering, resizing and
show/hide preferences 

Inline cell editing 

CSV export 

Virtualised infinite scrolling —
paging is the agreed pattern 

   ACCEPTANCE CRITERIA   → paste into the Acceptance Criteria field,
then append G1–G11   

AC1  One DataTable component serves the users, roles and
permissions lists, and no screen implements its own table markup. 

AC2  Paging, sorting, filtering and search are performed
server-side, and the component never requests the full collection in order to
filter it locally. 

AC3  Search is debounced at approximately 300 milliseconds
and is not sent below two characters. 

AC4  Sortable headers expose aria-sort, are operable by
keyboard, and indicate the current sort direction visually as well as
programmatically. 

AC5  Page, page size, sort, search and filters are
reflected in the URL query string, so a refresh, a back navigation or a shared
link restores exactly the same view. 

AC6  Changing a filter resets the page to the first page
rather than leaving the user on an out-of-range page. 

AC7  The footer states the visible range and the total
count, and the page-size control offers the documented set of options. 

AC8  While loading, skeleton rows matching the real column
widths are shown with the header visible. 

AC9  The empty, filtered-empty and error states are
visually and textually distinct, and the filtered-empty state offers a
clear-filters action. 

AC10  The error state keeps the toolbar usable and offers a
retry that preserves the current filters. 

AC11  Row actions all use one variant and size; where a row
has more than three actions, the surplus moves into an overflow menu. 

AC12  A row action the user lacks permission for is disabled
with a tooltip giving the reason, and is never rendered as an enabled control. 

AC13  Below the agreed breakpoint each row renders as a card
carrying the same data and the same actions. 

AC14  The component uses real table semantics with an
accessible name, and each row action has an accessible name that identifies its
row rather than repeating a bare verb. 

AC15  After a row is removed, focus moves to a sensible
neighbouring element rather than to the document body. 

AC16  The sticky header never obscures the focus indicator
of focusable content within a row. 

AC17  Under RTL the column order, sort indicators and
pagination controls mirror, while email addresses, permission codes and numeric
identifiers remain left-to-right. 

AC18  Date
columns render in the user's locale and timezone, with the absolute value
available on hover.
 

  

 

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
