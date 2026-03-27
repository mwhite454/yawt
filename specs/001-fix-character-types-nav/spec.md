```markdown
# Feature Specification: Fix Character Types Navigation

**Feature Branch**: `001-fix-character-types-nav`
**Created**: 2026-02-17
**Status**: Draft

**Input**: User description: "as a user, when editing Character Types I can create several character types easily; however I cannot return to the series/[seriesid]/characters without clicking back. either the character type editor is incorrectly located in the file system and the Layout is not correctly allowing you to navigate in the series, or character types are edited at a User level? The heirarchy is unclear as a user and the navigation is frustrating."

## Clarifications

### Session 2026-02-17

- Q: Character Type scope and import behavior → A: Use `Copy` and `Read-only link` import modes. No symlink/back-propagation from imported/linked copies to the source (edits in the target do not modify the origin). Multi-select import and conflict resolution remain supported.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Return-to-Series from Character Type Editor (Priority: P1)

As a series author, I can open the Character Type editor from a Series context and return to the Series' Characters list with a single click so I don't lose my place in the series workflow.

**Why this priority**: This is the primary pain-point described by users — navigation interrupts author flow and increases cognitive load.

**Independent Test**: From the Series page, click to edit a Character Type, then use the editor UI to return to the Series Characters list without using the browser Back button.

**Acceptance Scenarios**:

1. **Given** I am on `series/{seriesId}/characters` and I click to edit a Character Type, **When** the editor opens, **Then** the editor header shows a clear link labeled `Back to Characters` that returns me to `series/{seriesId}/characters` in one click.
2. **Given** I edit and save changes, **When** I click `Back to Characters`, **Then** I arrive at the same `series/{seriesId}/characters` view and the updated Character Type is visible.
3. **Given** I open a Character Type from outside a Series (if allowed), **When** the editor is shown, **Then** the editor exposes where this type is used (list of Series) and a sensible default return path (e.g., `My Characters` or the originating Series).

---

### User Story 2 - Clear Scope & Location (Priority: P2)

As a user, I can understand whether Character Types are scoped to a Series or to my User account so I can predict where edited types will be saved and where to find them later.

**Why this priority**: Ambiguity around scope drives confusion and misnavigation; clarifying scope is required to design correct navigation and persistent links.

**Independent Test**: Documentation + UI label that indicates scope; editing a type from a Series preserves series context if Series-scoped; editing a global type shows the list of Series that reference it if User-scoped.

**Acceptance Scenarios**:

1. **Given** Character Types are Series-scoped, **When** I open an editor from a Series, **Then** all navigation and breadcrumbs indicate the parent Series and return links go to that Series.
2. **Given** Character Types are User/global-scoped, **When** I open an editor from a Series, **Then** the editor shows an explicit link back to the originating Series plus a persistent link to `My Character Types`.

---

### User Story 3 - Layout and File Location Review (Priority: P3)

As a developer/maintainer, I can validate whether the editor component lives under a Series route or a global route so the code layout and routes match intended UX.

**Why this priority**: If the component/files are mis-organized, fixes may require moving code and adjusting route composition; identifying this prevents incorrect quick fixes.

**Independent Test**: Code review confirms file route placement; a local dev run demonstrates the editor route behavior matches spec.

**Acceptance Scenarios**:

1. **Given** the editor currently lives at a global route, **When** a change is implemented to preserve Series context, **Then** the route or layout must provide the correct parent context and a single-click return.

---

### Edge Cases

- Editing a Character Type while offline or with unsaved changes — editor must warn before navigating away.
- Deep-linked editor URL (shared link) should open in a predictable default context and expose navigation back to a logical parent.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The Character Type editor UI MUST show a clear parent-context link (e.g., `Back to Characters` or breadcrumb) when opened from a Series context.
- **FR-002**: When opened from `series/{seriesId}/characters`, the editor MUST preserve `seriesId` in the return path and navigate back in one click.
- **FR-003**: The editor MUST display the scope of the Character Type (Series-scoped or User/global-scoped) prominently in the editor header.
- **FR-004**: If Character Types are global/User-scoped, the editor MUST display the Series(es) that reference the type and provide a clear way to return to the originating Series when applicable.
- **FR-005**: Navigational changes MUST not lose unsaved edits without showing a confirmation dialog.
- **FR-006**: Routes and Layout composition MUST provide `seriesId` context to the editor when accessed from a Series; if the component is currently located under a global route, the routing path or layout must be adjusted so UI shows correct parent context.
- **FR-007**: The codebase MUST include automated integration tests that exercise: opening editor from Series, saving changes, and returning to the same Series Characters view.
- **FR-008**: UX labels and help text MUST be updated to make scope and navigation explicit to users.

_Note_: **FR-006** ties to an implementation decision: whether the editor component should be nested under Series routes or accept `seriesId` via route params/query. This decision affects routing but not the user-visible behavior.

### Key Entities

- **CharacterType**: id, name, description, fields, usage references (list of Series ids)
- **Series**: id, title, characters collection
- **User**: id, displayName, personal Character Types (if applicable)
- **NavigationState**: originRoute, originSeriesId, lastVisitedCharactersView

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: From a Series Characters list, users can return to `series/{seriesId}/characters` in one click in 95% of attempted editor/return workflows.
- **SC-002**: After implementation, user support tickets or feedback mentioning "character type navigation" decrease by 60% within 30 days.
- **SC-003**: Acceptance tests that cover Series-originated editor flows pass in CI (manual verification: tests exercise open → edit → save → return).
- **SC-004**: Usability check: 90% of test participants (internal QA or stakeholder reviewers) correctly identify where a Character Type will be saved (Series vs global) from the editor UI in a quick-read test.

## Assumptions

- Character Types are Series-scoped (per-Series). Users can import or copy Character Types from their other Series via an Import UI (see below). This decision drives the UX and routing assumptions: the editor is shown in the context of a Series and must preserve `seriesId`.
- The existing routes include `series/{seriesId}/characters` and there is an editor UI reachable from that view.
- The fix should be limited to ensuring correct navigation and UX; a full redesign of the site navigation is out of scope.

## Import / Reuse UX (design note)

Users should be able to import Character Types from their other Series easily. The editor header should include an `Import From Other Series` button which opens a popover. The popover contains an accordion-style list of the user's Series; expanding a Series shows available Character Types. For each listed type the user can choose one of three actions:

- **Link (read-only reference)**: create a reference to the origin Character Type. The referencing Series cannot edit the origin via this reference (no back-propagation); changes must be made in the origin Series. References may reflect origin updates (origin→reference), but edits in the referencing Series are not propagated to source.
- **Copy**: duplicate the Character Type into the current Series under a new id and name for local modification (no propagation to the origin).

The popover must allow multi-select and show a preview of what will be imported before confirming. If a user attempts to import a type that conflicts with an existing local name, the UI should prompt to rename or skip.

### New Functional Requirements (import)

- **FR-009**: The editor MUST include an `Import From Other Series` button that opens a popover containing an accordion list of Series and their Character Types.
- **FR-010**: The import popover MUST allow the user to choose `Symlink`, `Link`, or `Copy` for each selected Character Type and confirm the operation.
- **FR-011**: The import flow MUST support multi-select, preview, and conflict resolution (rename/skip) before applying changes to the current Series.
- **FR-012**: The import flow MUST support `Link (read-only)` and `Copy` behaviors. For `Link (read-only)`, the system MUST create a reference to the origin Character Type that cannot be edited from the referencing Series (no propagation from referencing Series to origin). For `Copy`, the system MUST create a new `CharacterType` id scoped to the current Series.
- **FR-013**: The import UI MUST show the origin Series for each type and who created it (at least series title and created-by), to help authors identify templates.

## Dependencies

- Product-owner decision on `CharacterType` scope (Series vs User/global).
- Small UX copy update to label scope in the editor header.
- Possible minor routing/layout change in the codebase to pass `seriesId` to the editor component.

## Out of Scope

- Global navigation redesign.
- Large refactors of unrelated routes or moving unrelated pages.

## Acceptance Criteria

- Implemented UI shows a `Back to Characters` parent link in the editor header when opened from a Series and navigates to `series/{seriesId}/characters`.
- Editor indicates Character Type scope clearly.
- Unsaved changes prompt before navigation.

## Next Steps

1. Confirm Character Type scope (Series vs User/global).
2. Update the editor UI to include parent-context link and scope label.
3. Add/adjust routes or layout to pass `seriesId` where appropriate.
4. Add integration tests and QA the flows.

```
