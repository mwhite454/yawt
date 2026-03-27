```markdown
# Research: Fix Character Types Navigation

Decision: Character Types will be Series-scoped for this change; the editor will be surfaced from `series/{seriesId}/characters` and accept `seriesId` via route params. The editor will expose an explicit `Back to Characters` link that navigates to `series/{seriesId}/characters`.

Rationale:
- The spec's user-facing requirements (FR-001, FR-002, FR-006) prioritize preserving Series context and a single-click return path. Treating Character Types as Series-scoped aligns UI expectations and minimizes surprise for users editing from a Series context.
- Implementing the editor as a Series-scoped route (`routes/series/[seriesId]/characters/[typeId].tsx` or an editor island within that route) is the least invasive change: it leverages Fresh's file-based routing and existing `series/{seriesId}` context without introducing global-level routing complexity.
- Passing `seriesId` as a required route param removes ambiguity about return targets and simplifies breadcrumbs and header links.

Alternatives Considered:
- Global/User-scoped Character Types with origin tracking: Keep editor under global route (`/characters/[typeId]`) and pass an `origin` query param (e.g., `?origin=/series/{seriesId}/characters`). Rejected because it requires robust origin handling, increases deep-link complexity, and may surface confusing UX when origin is missing.
- Context-passing via navigation state (history.state): Use JS history state to remember origin. Rejected because SSR-first constraint and users may open deep links (no navigation state), making predictable behavior harder.

Implementation Notes / Next Technical Steps:
- Add route or nested editor page under `routes/series/[seriesId]/characters/` that renders the editor in server context and hydates an island for interactive editing.
- Editor header: show breadcrumb `Series Name → Characters → Edit Type` and a `Back to Characters` link that points to `/series/{seriesId}/characters` (preserve any query filters if present).
- If the editor is opened from another context (global list), show `Back to My Character Types` and list referencing Series; deep-links to `/characters/{typeId}` should include UI to surface referencing Series and a default sensible return target.
- Add integration tests covering: open editor from series, save, and click `Back to Characters` and verify view and updates.

Security / Data Notes:
- No data-model changes required for this navigation fix. If later we support copying/linking across Series, ensure `CharacterType` records include `usageReferences: string[]` (series ids) as already specified.

Decision Owner: Product + Dev (assumption aligned with existing spec). If Product changes scope to global, revert to alternative and plan migration.

```
