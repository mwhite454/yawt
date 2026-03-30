# Chapters Toggle & Book Navigation Redesign

**Date:** 2026-03-28
**Status:** Approved for implementation

---

## Context

Books currently allow scenes to live at both the book root level and inside chapters simultaneously. This hybrid state is a data mess and a UX problem — the hierarchy is confusing, hard to navigate, and export behaviour (frontmatter injection, page breaks) becomes ambiguous.

The fix: every book is either chapter-organized or flat. The user chooses at creation time and can change it in settings. The invariant is enforced at the API layer so the hybrid state can never recur.

Alongside this, the existing `HierarchicalSceneList` is not a final experience. This work ships a delightful, functional navigation sidebar with two distinct modes: a full navigation/reorganization view and a distraction-free focus writing mode.

---

## Data Model

### `Book` — new field

```typescript
hasChapters: boolean  // default: true
```

Added to:
- `utils/story/types.ts` (backend)
- `client/src/types/story.ts` (frontend)

**Invariant:**
- `hasChapters=true` → all scenes must have a `chapterId`; no book-level scenes allowed
- `hasChapters=false` → no scenes may have a `chapterId`; no chapters may exist

No changes to `BookItem`, order indexes, or scene storage keys.

---

## API Changes

### `PATCH /api/series/:seriesId/books/:bookId`

Gains `hasChapters` as a settable field.

**Toggling `true → false` (flatten):**
Atomic Deno KV transaction:
1. Read all chapters for the book
2. For each chapter: read its scenes, set `chapterId = undefined`, insert into `bookItemOrder`, remove from `chapterSceneOrder`
3. Delete all chapter entities and their `bookItemOrder` entries
4. Set `book.hasChapters = false`
5. Return a summary: `{ scenesFlattened, chaptersRemoved }`

**Toggling `false → true`:**
Just sets `book.hasChapters = true`. Book-level scenes remain at book level — user assigns them to chapters manually.

### `POST /api/.../chapters`

Returns `409 Conflict` with message if `book.hasChapters === false`.

### `POST /api/.../books/:bookId/scenes` (book-level)

Returns `409 Conflict` with message if `book.hasChapters === true`.

---

## Data Migration

Script: `scripts/migrate-chapters-toggle.ts`

Follows pattern of `scripts/migrate-book-item-order.ts`.

**Problem state to fix:** Books that currently have both chapters (with scenes inside) AND scenes at the book root level (the hybrid mess).

**Migration logic per book:**
1. Scan all books for the hybrid condition (has chapters AND has book-level scenes in `bookItemOrder`)
2. For hybrid books: create a new chapter titled "Uncategorized" with rank before all existing chapters
3. Move all book-level scenes into this new chapter (assign `chapterId`, update `chapterSceneOrder`, remove from `bookItemOrder` type "scene" entries)
4. Set `hasChapters = true` on all books (the default, since chapters were originally optional and the current state is chapters-enabled)
5. For books with no chapters at all: set `hasChapters = false`

**Flags:**
- `--dry-run` — prints what would change, no writes
- `--user-id <id>` — scope to a single user (for targeted prod migration)
- `--env` — `local` | `prod`

---

## Settings UI

### Book Settings Page (`client/src/pages/BookSettingsPage.tsx`)

New "Organization" section with a toggle: **"Organize scenes into chapters"** (default: on).

**Toggling off (chapters → flat):** Opens a confirmation modal showing:
- Number of chapters that will be removed
- Number of scenes that will be moved to book level
- Warning that chapters won't be auto-restored if toggled back on
- Explicit destructive confirm button ("Yes, remove chapters")

**Toggling on (flat → chapters):** Immediate, no confirmation needed. Book-level scenes stay put until manually assigned.

### Create Book Form (`client/src/pages/SeriesDetailPage.tsx`)

Add `hasChapters` toggle defaulting to `true` with explanatory text:

> "Chapters let you group scenes, add descriptions, and control page breaks when exporting. You can change this later in book settings."

---

## Navigation UI

### Two-Mode Sidebar

The sidebar has two states driven by editor focus. No mode switcher button — the transition is automatic.

#### Navigation Mode (default, editor unfocused)

Full accordion sidebar showing the complete book map:
- Chapters as collapsible rows with drag handles for reordering
- Scenes nested inside expanded chapters, also draggable
- Scene count badge on collapsed chapters
- "+ scene" inline below each chapter's scene list
- "+ chapter" at the bottom of the list
- All drag-and-drop operations call the existing `/api/.../items/reorder` endpoint

#### Focus Mode (cursor enters editor)

Sidebar transitions to a minimal strip:
- Narrows to ~44px
- Chapters become numbered pills (low opacity)
- Breadcrumb in editor header fades to near-invisible contrast
- Active chapter pill is slightly highlighted
- Hover over the strip → expands temporarily to full navigation mode without losing editor focus
- Click the strip or press `Escape` → returns fully to navigation mode

Transition: CSS `transition: width 0.25s ease, opacity 0.2s ease`. Fast enough to feel responsive, slow enough to feel intentional.

#### When `hasChapters=false`

Sidebar shows a flat scene list with drag handles — no chapter grouping, no "+ chapter" button. Focus mode collapses the same way but pills show scene numbers instead of chapter numbers.

### Implementation Notes

- Replace the existing `HierarchicalSceneList` island (`islands/HierarchicalSceneList.tsx`) and client component (`client/src/components/HierarchicalSceneList.tsx`) with the new two-mode sidebar
- Drag-and-drop: use existing reorder API, keep fractional rank system unchanged
- Sidebar state (navigation vs focus) is local component state — not persisted
- The custom scrollbar on the sidebar should be styled to match the app theme (thin, dark, no native OS scrollbar)

---

## Error Handling

- `409` from chapter or scene creation endpoints → show toast notification with explanation
- Flatten operation failure (Deno KV transaction fails) → surface error, no partial state (atomic)
- Migration script: any per-book error is logged and skipped, does not halt the full run

---

## Verification

### Manual
1. Create a book with `hasChapters=true` → confirm chapters UI appears, book-level scene creation is blocked
2. Create a book with `hasChapters=false` → confirm no chapter UI, chapter creation returns 409
3. Toggle `true → false` in settings → confirm modal shows correct counts, flatten is atomic, no scenes lost
4. Toggle `false → true` → confirm immediate, no data changes
5. Navigate into a scene, start typing → confirm sidebar transitions to focus mode; hover/escape returns to nav mode
6. Run migration with `--dry-run` on local dev data → verify hybrid books are identified and "Uncategorized" chapter plan is correct
7. Run migration without `--dry-run` → verify data integrity (scene count unchanged, no orphaned scenes)

### API
- `POST /api/.../chapters` on `hasChapters=false` book → `409`
- `POST /api/.../scenes` (book-level) on `hasChapters=true` book → `409`
- `PATCH /api/.../books/:bookId` with `hasChapters: false` → returns flatten summary

---

## Files to Modify

| File | Change |
|------|--------|
| `utils/story/types.ts` | Add `hasChapters: boolean` to `Book` |
| `client/src/types/story.ts` | Add `hasChapters: boolean` to `Book` |
| `routes/api/series/[seriesId]/books/[bookId].ts` | Handle `hasChapters` in PATCH, implement flatten |
| `routes/api/series/[seriesId]/books/[bookId]/chapters.ts` | 409 guard on POST |
| `routes/api/series/[seriesId]/books/[bookId]/scenes.ts` | 409 guard on POST |
| `client/src/pages/BookSettingsPage.tsx` | Add toggle + confirmation modal |
| `client/src/pages/SeriesDetailPage.tsx` | Add toggle to create form |
| `client/src/components/HierarchicalSceneList.tsx` | Rewrite as two-mode sidebar |
| `client/src/pages/BookDetailPage.tsx` | Pass `hasChapters` to sidebar, wire editor focus events |
| `islands/HierarchicalSceneList.tsx` | Update/replace Fresh island |
| `routes/series/[seriesId]/books/[bookId].tsx` | Pass `hasChapters` to island, fetch from book data |
| `scripts/migrate-chapters-toggle.ts` | New migration script |
