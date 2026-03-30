# Chapters Toggle & Book Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `hasChapters` boolean to `Book`, enforce it at the API layer, provide settings/create-form UI for toggling, and replace the non-functional `HierarchicalSceneList` with a delightful two-mode sidebar (navigation mode + focus/writing mode).

**Architecture:** `hasChapters` is stored on the `Book` entity and enforced in the POST handlers for chapters and book-level scenes (409 if violated). Toggling from chapters→flat atomically flattens all chapter scenes to book-level. The sidebar is a single React component with two CSS-transition states driven by editor focus events bubbled up from `BookDetailPage`.

**Tech Stack:** Deno KV + Fresh (backend), React 19 + Vite + TanStack Query + @dnd-kit (frontend), TypeScript throughout.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `utils/story/types.ts` | Modify | Add `hasChapters: boolean` to `Book` |
| `client/src/types/story.ts` | Modify | Add `hasChapters: boolean` to `Book` |
| `routes/api/series/[seriesId]/books/[bookId].ts` | Modify | Add `PATCH` handler for `hasChapters` toggle with flatten logic |
| `routes/api/series/[seriesId]/books/[bookId]/chapters.ts` | Modify | 409 guard on `POST` when `book.hasChapters === false` |
| `routes/api/series/[seriesId]/books/[bookId]/scenes.ts` | Modify | 409 guard on `POST` when `book.hasChapters === true` |
| `routes/api/series/[seriesId]/books/index.ts` | Modify | Pass `hasChapters` in book creation POST |
| `client/src/api/books.ts` | Modify | Add `toggleChapters()` method; update `create()` to accept `hasChapters` |
| `client/src/hooks/use-books.ts` | Modify | Add `useToggleChaptersMutation`; update `useCreateBookMutation` |
| `client/src/pages/BookSettingsPage.tsx` | Modify | Add Organization section with toggle + confirmation modal |
| `client/src/pages/SeriesDetailPage.tsx` | Modify | Add `hasChapters` toggle to create form |
| `client/src/components/HierarchicalSceneList.tsx` | Rewrite | Two-mode sidebar (navigation + focus) |
| `client/src/pages/BookDetailPage.tsx` | Modify | Pass `hasChapters` + editor focus events to sidebar |
| `scripts/migrate-chapters-toggle.ts` | Create | Migration script for hybrid books + backfill `hasChapters` |

---

## Task 1: Add `hasChapters` to Both Type Files

**Files:**
- Modify: `utils/story/types.ts`
- Modify: `client/src/types/story.ts`

- [ ] **Step 1: Add field to backend types**

In `utils/story/types.ts`, update the `Book` interface:

```typescript
export interface Book {
  id: string;
  userId: UserId;
  seriesId: string;
  rank: string;
  title: string;
  author?: string;
  publishDate?: string;
  isbn?: string;
  coverImage?: AssetImage;
  hasChapters: boolean;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 2: Add field to frontend types**

In `client/src/types/story.ts`, update the `Book` interface the same way:

```typescript
export interface Book {
  id: string;
  userId: UserId;
  seriesId: string;
  rank: string;
  title: string;
  author?: string;
  publishDate?: string;
  isbn?: string;
  coverImage?: AssetImage;
  hasChapters: boolean;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add utils/story/types.ts client/src/types/story.ts
git commit -m "feat: add hasChapters field to Book type"
```

---

## Task 2: API — Book Creation Accepts `hasChapters`

**Files:**
- Modify: `routes/api/series/[seriesId]/books/index.ts` (or wherever the book `POST` handler lives — check `routes/api/series/[seriesId]/books.ts`)

> **Note:** First run `grep -r "async POST" routes/api/series/` to confirm the exact file path for book creation.

- [ ] **Step 1: Locate the book creation POST handler**

Run:
```bash
grep -rn "async POST" /Users/mykawhite/Documents/GitHub/yawt/routes/api/series/
```

Find the handler that creates a `Book` entity and writes `bookOrderKey`.

- [ ] **Step 2: Add `hasChapters` parsing and default**

In the POST handler body parsing section, after extracting `title` and `author`, add:

```typescript
const hasChapters = typeof body.hasChapters === "boolean"
  ? body.hasChapters
  : true; // default: chapters enabled
```

- [ ] **Step 3: Include `hasChapters` in the created `Book` entity**

In the `book: Book = { ... }` object literal, add:

```typescript
hasChapters,
```

- [ ] **Step 4: Manually test**

```bash
# Start the dev server and POST a new book without hasChapters — should default to true
# POST a book with hasChapters: false — should be false
```

- [ ] **Step 5: Commit**

```bash
git add routes/api/series/
git commit -m "feat: book creation accepts hasChapters, defaults to true"
```

---

## Task 3: API — 409 Guards on Chapter and Scene Creation

**Files:**
- Modify: `routes/api/series/[seriesId]/books/[bookId]/chapters.ts`
- Modify: `routes/api/series/[seriesId]/books/[bookId]/scenes.ts`

- [ ] **Step 1: Add guard to chapter creation**

In `routes/api/series/[seriesId]/books/[bookId]/chapters.ts`, in the `POST` handler, immediately after the book existence check, add:

```typescript
const bookData = book.value as import("@utils/story/types.ts").Book;
if (bookData.hasChapters === false) {
  return json(
    { error: "This book does not use chapters. Enable chapters in book settings first." },
    { status: 409 },
  );
}
```

The existing check is:
```typescript
const book = await kv.get(bookKey(user.id, seriesId, bookId));
if (!book.value) return notFound("Book not found");
```

Insert the guard directly after that block.

- [ ] **Step 2: Add guard to book-level scene creation**

In `routes/api/series/[seriesId]/books/[bookId]/scenes.ts`, in the `POST` handler, immediately after the book existence check, add:

```typescript
const bookData = book.value as import("@utils/story/types.ts").Book;
if (bookData.hasChapters === true) {
  return json(
    { error: "This book uses chapters. Add scenes within a chapter instead." },
    { status: 409 },
  );
}
```

Note: `bookData.hasChapters === true` must also handle the legacy case where the field is `undefined` (existing books before migration). Use:

```typescript
if (bookData.hasChapters !== false) {
  return json(
    { error: "This book uses chapters. Add scenes within a chapter instead." },
    { status: 409 },
  );
}
```

This means `hasChapters=undefined` (old data) is treated as `true` until migration runs.

- [ ] **Step 3: Commit**

```bash
git add routes/api/series/[seriesId]/books/[bookId]/chapters.ts \
        routes/api/series/[seriesId]/books/[bookId]/scenes.ts
git commit -m "feat: enforce hasChapters constraint in chapter/scene creation"
```

---

## Task 4: API — PATCH Handler for Toggling `hasChapters`

**Files:**
- Modify: `routes/api/series/[seriesId]/books/[bookId].ts`

- [ ] **Step 1: Add the PATCH handler**

In `routes/api/series/[seriesId]/books/[bookId].ts`, add a `PATCH` method to the `handler` object. This handles the `hasChapters` toggle. Add it after the `PUT` handler:

```typescript
async PATCH(req, ctx) {
  const userOrRes = await requireUser(req);
  if (userOrRes instanceof Response) return userOrRes;
  const user = userOrRes;
  const { seriesId, bookId } = ctx.params;

  const key = bookKey(user.id, seriesId, bookId);
  const entry = await kv.get<Book>(key);
  if (!entry.value) return notFound("Book not found");

  const bodyOrRes = await readJson(req);
  if (bodyOrRes instanceof Response) return bodyOrRes;
  const body = bodyOrRes as Record<string, unknown>;

  if (typeof body.hasChapters !== "boolean") {
    return badRequest("hasChapters must be a boolean");
  }

  const currentHasChapters = entry.value.hasChapters !== false; // treat undefined as true
  const nextHasChapters = body.hasChapters as boolean;

  // No-op if already in desired state
  if (currentHasChapters === nextHasChapters) {
    return json({ book: entry.value, scenesFlattened: 0, chaptersRemoved: 0 }, { status: 200 });
  }

  if (!nextHasChapters) {
    // Flatten: move all chapter scenes to book-level, delete chapters
    return await flattenChapters(kv, user.id, seriesId, bookId, entry.value, key);
  } else {
    // Enable chapters: just flip the flag
    const updated: Book = { ...entry.value, hasChapters: true, updatedAt: Date.now() };
    await kv.set(key, updated);
    return json({ book: updated, scenesFlattened: 0, chaptersRemoved: 0 }, { status: 200 });
  }
},
```

- [ ] **Step 2: Add the `flattenChapters` helper**

Add this function at the top of the file, before the `handler` export. It requires these imports (already present): `kv`, `bookKey`, `bookItemOrderKey`, `chapterKey`, `sceneKey`. Add `chapterSceneOrderKey` to the import from `@utils/story/keys.ts`:

```typescript
import {
  bookItemOrderKey,
  bookKey,
  bookOrderKey,
  chapterKey,
  chapterSceneOrderKey,
  sceneKey,
} from "@utils/story/keys.ts";
import type { Book, BookItem, Chapter, Scene } from "@utils/story/types.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";
```

Then add the helper function:

```typescript
async function flattenChapters(
  kv: Deno.Kv,
  userId: number,
  seriesId: string,
  bookId: string,
  book: Book,
  bookEntityKey: Deno.KvKey,
): Promise<Response> {
  // 1. Collect all chapters (in order)
  const chapterItems: Array<{ rank: string; id: string }> = [];
  for await (
    const entry of kv.list<BookItem>({
      prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId],
    })
  ) {
    if (entry.value?.type === "chapter") {
      const rankKey = entry.key[entry.key.length - 1] as string;
      chapterItems.push({ rank: rankKey, id: entry.value.id });
    }
  }

  let scenesFlattened = 0;
  const chaptersRemoved = chapterItems.length;

  // 2. For each chapter: move its scenes to book-level, then delete the chapter
  // We need to assign new ranks for book-level scenes after existing book-level scenes
  // First, find the last existing book-level scene rank
  let lastBookRank: string | undefined;
  for await (
    const entry of kv.list<BookItem>(
      { prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId] },
      { reverse: true, limit: 1 },
    )
  ) {
    const rank = entry.key[entry.key.length - 1] as string;
    if (typeof rank === "string") lastBookRank = rank;
  }

  for (const { id: chapterId } of chapterItems) {
    // Collect scenes in this chapter
    const chapterScenes: Array<{ rank: string; sceneId: string }> = [];
    for await (
      const entry of kv.list({
        prefix: ["yawt", "chapterSceneOrder", userId, seriesId, bookId, chapterId],
      })
    ) {
      const key = entry.key;
      const rank = key[key.length - 2] as string;
      const sceneId = key[key.length - 1] as string;
      chapterScenes.push({ rank, sceneId });
    }
    // chapterScenes are already sorted by rank due to KV prefix ordering

    for (const { sceneId } of chapterScenes) {
      const newRank = lastBookRank ? rankAfter(lastBookRank) : rankInitial();
      lastBookRank = newRank;

      const sceneEntityKey = sceneKey(userId, seriesId, bookId, sceneId);
      const sceneEntry = await kv.get<Scene>(sceneEntityKey);
      if (!sceneEntry.value) continue;

      const updatedScene: Scene = {
        ...sceneEntry.value,
        chapterId: undefined,
        rank: newRank,
        updatedAt: Date.now(),
      };

      const chapterSceneOrderPrefix = [
        "yawt", "chapterSceneOrder", userId, seriesId, bookId, chapterId,
      ];
      // Find and delete the chapterSceneOrder entry for this scene
      let chapterSceneOrderEntryKey: Deno.KvKey | null = null;
      for await (
        const entry of kv.list({ prefix: chapterSceneOrderPrefix })
      ) {
        const entrySceneId = entry.key[entry.key.length - 1] as string;
        if (entrySceneId === sceneId) {
          chapterSceneOrderEntryKey = entry.key;
          break;
        }
      }

      const op = kv.atomic()
        .set(sceneEntityKey, updatedScene)
        .set(bookItemOrderKey(userId, seriesId, bookId, newRank), {
          type: "scene" as const,
          id: sceneId,
        });

      if (chapterSceneOrderEntryKey) {
        op.delete(chapterSceneOrderEntryKey);
      }

      await op.commit();
      scenesFlattened++;
    }

    // Delete the chapter entity and its bookItemOrder entry
    let chapterOrderKey: Deno.KvKey | null = null;
    for await (
      const entry of kv.list<BookItem>({
        prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId],
      })
    ) {
      if (entry.value?.type === "chapter" && entry.value.id === chapterId) {
        chapterOrderKey = entry.key;
        break;
      }
    }

    const deleteOp = kv.atomic().delete(chapterKey(userId, seriesId, bookId, chapterId));
    if (chapterOrderKey) deleteOp.delete(chapterOrderKey);
    await deleteOp.commit();
  }

  // 3. Update the book entity
  const updatedBook: Book = {
    ...book,
    hasChapters: false,
    updatedAt: Date.now(),
  };
  await kv.set(bookEntityKey, updatedBook);

  return json({ book: updatedBook, scenesFlattened, chaptersRemoved }, { status: 200 });
}
```

- [ ] **Step 3: Commit**

```bash
git add routes/api/series/[seriesId]/books/[bookId].ts
git commit -m "feat: PATCH /books/:bookId toggles hasChapters, flattens chapters atomically"
```

---

## Task 5: Client API + Hooks

**Files:**
- Modify: `client/src/api/books.ts`
- Modify: `client/src/hooks/use-books.ts`

- [ ] **Step 1: Update `booksApi`**

Replace `client/src/api/books.ts` with:

```typescript
import { api } from "@/lib/api";
import type { Book } from "@/types/story";

export const booksApi = {
  list: (seriesId: string) => api.get<Book[]>(`/api/series/${seriesId}/books`),
  get: (seriesId: string, bookId: string) =>
    api.get<Book>(`/api/series/${seriesId}/books/${bookId}`),
  create: (
    seriesId: string,
    data: Pick<Book, "title"> &
      Partial<Pick<Book, "author" | "publishDate" | "isbn" | "hasChapters">>,
  ) => api.post<Book>(`/api/series/${seriesId}/books`, data),
  update: (
    seriesId: string,
    bookId: string,
    data: Partial<Pick<Book, "title" | "author" | "publishDate" | "isbn">>,
  ) => api.put<Book>(`/api/series/${seriesId}/books/${bookId}`, data),
  toggleChapters: (
    seriesId: string,
    bookId: string,
    hasChapters: boolean,
  ) =>
    api.patch<{ book: Book; scenesFlattened: number; chaptersRemoved: number }>(
      `/api/series/${seriesId}/books/${bookId}`,
      { hasChapters },
    ),
  delete: (seriesId: string, bookId: string) =>
    api.delete<void>(`/api/series/${seriesId}/books/${bookId}`),
};
```

> **Note:** Check `client/src/lib/api.ts` to confirm a `patch` method exists. If not, add it following the same pattern as `put`.

- [ ] **Step 2: Check `api.patch` exists**

```bash
grep -n "patch" /Users/mykawhite/Documents/GitHub/yawt/client/src/lib/api.ts
```

If `patch` is missing, open `client/src/lib/api.ts` and add it following the same pattern as `put`:

```typescript
patch: <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body }),
```

- [ ] **Step 3: Add `useToggleChaptersMutation` to hooks**

In `client/src/hooks/use-books.ts`, add after `useDeleteBookMutation`:

```typescript
export function useToggleChaptersMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hasChapters: boolean) =>
      booksApi.toggleChapters(seriesId, bookId, hasChapters),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKeys.detail(seriesId, bookId) });
      qc.invalidateQueries({ queryKey: booksKeys.all(seriesId) });
    },
  });
}
```

Also update `useCreateBookMutation` to accept `hasChapters`:

```typescript
export function useCreateBookMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Book, "title"> &
        Partial<Pick<Book, "author" | "publishDate" | "isbn" | "hasChapters">>,
    ) => booksApi.create(seriesId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: booksKeys.all(seriesId) }),
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/api/books.ts client/src/hooks/use-books.ts client/src/lib/api.ts
git commit -m "feat: add toggleChapters API method and mutation hook"
```

---

## Task 6: Book Settings — Chapters Toggle + Confirmation Modal

**Files:**
- Modify: `client/src/pages/BookSettingsPage.tsx`

- [ ] **Step 1: Add the Organization section with toggle and modal**

Replace `client/src/pages/BookSettingsPage.tsx` with the following. Key additions: `hasChapters` state synced from book data, a toggle card, and a confirmation modal that shows impact counts before flattening.

```typescript
import { useState, useEffect } from "react";
import { ChevronLeft, Layers, Trash2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useBookQuery,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useToggleChaptersMutation,
} from "@/hooks/use-books";
import { useChaptersQuery, useScenesQuery } from "@/hooks/use-book-content";

export function BookSettingsPage() {
  const { seriesId = "", bookId = "" } = useParams<{
    seriesId: string;
    bookId: string;
  }>();
  const navigate = useNavigate();

  const { data: book, isLoading } = useBookQuery(seriesId, bookId);
  const { data: chapters = [] } = useChaptersQuery(seriesId, bookId);
  const { data: scenes = [] } = useScenesQuery(seriesId, bookId);
  const updateBook = useUpdateBookMutation(seriesId, bookId);
  const deleteBook = useDeleteBookMutation(seriesId);
  const toggleChapters = useToggleChaptersMutation(seriesId, bookId);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [isbn, setIsbn] = useState("");
  const [showFlattenModal, setShowFlattenModal] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title ?? "");
      setAuthor(book.author ?? "");
      setPublishDate(book.publishDate ?? "");
      setIsbn(book.isbn ?? "");
    }
  }, [book]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateBook.mutateAsync({ title, author, publishDate, isbn });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${book?.title}"? This cannot be undone.`)) return;
    await deleteBook.mutateAsync(bookId);
    navigate(`/series/${seriesId}`);
  }

  function handleChaptersToggle() {
    const currentlyHasChapters = book?.hasChapters !== false;
    if (currentlyHasChapters) {
      // Turning off — show confirmation modal
      setShowFlattenModal(true);
    } else {
      // Turning on — no confirmation needed
      toggleChapters.mutate(true);
    }
  }

  async function handleConfirmFlatten() {
    await toggleChapters.mutateAsync(false);
    setShowFlattenModal(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading book settings…</p>
      </div>
    );
  }

  if (!book) return <p className="p-6 text-red-400">Book not found.</p>;

  const hasChapters = book.hasChapters !== false;
  const chapterSceneCount = scenes.filter((s) => s.chapterId).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-1 border-b border-white/10 px-1 pb-2">
        <button
          type="button"
          onClick={() => navigate(`/series/${seriesId}/books/${bookId}`)}
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to manuscript
        </button>
        <div className="panel-title">Book Settings</div>
        <h1 className="text-sm font-semibold text-white">{book.title}</h1>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="pt-2.5">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1">
              <div className="panel-title">Title</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <div className="panel-title">Author</div>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <div className="panel-title">Publish Date</div>
              <Input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <div className="panel-title">ISBN</div>
              <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            </div>
            <Button type="submit" disabled={updateBook.isPending}>
              {updateBook.isPending ? <Spinner /> : null}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-400" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2.5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="panel-title mb-1">Organize scenes into chapters</div>
              <p className="text-[11px] text-gray-400 max-w-sm">
                Chapters group scenes and add page breaks when exporting.
                {hasChapters
                  ? ` This book has ${chapters.length} chapter${chapters.length !== 1 ? "s" : ""}.`
                  : " This book uses a flat scene list."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleChaptersToggle}
              disabled={toggleChapters.isPending}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                hasChapters ? "bg-indigo-500" : "bg-gray-600"
              } ${toggleChapters.isPending ? "opacity-50" : ""}`}
              aria-checked={hasChapters}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  hasChapters ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Flatten confirmation modal */}
      {showFlattenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-2 text-sm font-semibold text-white">
              Remove chapters from this book?
            </h2>
            <p className="mb-4 text-[11px] text-gray-400 leading-relaxed">
              This will remove <strong className="text-white">{chapters.length} chapter{chapters.length !== 1 ? "s" : ""}</strong> and
              move <strong className="text-white">{chapterSceneCount} scene{chapterSceneCount !== 1 ? "s" : ""}</strong> to a flat list.
            </p>
            <ul className="mb-4 space-y-1 text-[11px] text-gray-400">
              <li>✓ All scene text and frontmatter is preserved</li>
              <li>✓ Scene order is preserved within each chapter</li>
              <li>⚠ Chapter titles and descriptions will be deleted</li>
              <li>⚠ Chapters are not restored automatically if you re-enable this setting</li>
            </ul>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleConfirmFlatten}
                disabled={toggleChapters.isPending}
              >
                {toggleChapters.isPending ? <Spinner /> : null}
                Yes, remove chapters
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFlattenModal(false)}
                disabled={toggleChapters.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2.5">
          <Alert variant="warning">
            Deleting a book removes its chapters and scenes from this series.
          </Alert>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete Book
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/BookSettingsPage.tsx
git commit -m "feat: add chapters toggle with confirmation modal to book settings"
```

---

## Task 7: Create Book Form — `hasChapters` Toggle

**Files:**
- Modify: `client/src/pages/SeriesDetailPage.tsx`

- [ ] **Step 1: Add `hasChapters` state to the create form**

In `SeriesDetailPage.tsx`, add state for `hasChapters` near the other form state variables:

```typescript
const [hasChapters, setHasChapters] = useState(true);
```

- [ ] **Step 2: Update `handleCreate` to pass `hasChapters`**

```typescript
async function handleCreate(e: React.FormEvent) {
  e.preventDefault();
  await createMutation.mutateAsync({ title, author: author || undefined, hasChapters });
  setTitle("");
  setAuthor("");
  setHasChapters(true);
  setShowCreate(false);
}
```

- [ ] **Step 3: Add toggle to the create form UI**

Inside the `<form>` in the create card, add after the author `<Input>`:

```tsx
<div className="flex items-start gap-3 rounded-md border border-white/10 p-3">
  <button
    type="button"
    onClick={() => setHasChapters((v) => !v)}
    className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      hasChapters ? "bg-indigo-500" : "bg-gray-600"
    }`}
    aria-checked={hasChapters}
    role="switch"
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
        hasChapters ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
  <div>
    <div className="panel-title mb-0.5">Organize scenes into chapters</div>
    <p className="text-[11px] text-gray-400">
      Chapters group scenes, add descriptions, and control page breaks when exporting.
      You can change this later in book settings.
    </p>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/SeriesDetailPage.tsx
git commit -m "feat: add hasChapters toggle to create book form"
```

---

## Task 8: Two-Mode Sidebar — Rewrite `HierarchicalSceneList`

**Files:**
- Rewrite: `client/src/components/HierarchicalSceneList.tsx`

This is the core UI component. It renders two modes:
- **Navigation mode**: full accordion with drag handles
- **Focus mode**: narrow strip of chapter number pills (~44px)

The mode switches automatically when the parent calls `onEditorFocus` / `onEditorBlur` callbacks. Hover over the collapsed strip temporarily expands it.

- [ ] **Step 1: Rewrite `HierarchicalSceneList.tsx`**

```typescript
import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Chapter, Scene } from "@/types/story";
import { rankBetween } from "@/lib/rank";

interface BookItem {
  type: "chapter" | "scene";
  id: string;
  rank: string;
}

interface HierarchicalSceneListProps {
  seriesId: string;
  bookId: string;
  chapters: Chapter[];
  scenes: Scene[];
  hasChapters: boolean;
  focusMode: boolean; // controlled by parent via editor focus
  activeSceneId?: string;
  onReorder: (items: BookItem[]) => void;
  onCreateChapter: (title: string) => void;
  onCreateScene: (chapterId?: string) => void;
  onSelectScene: (scene: Scene) => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onDeleteScene: (sceneId: string) => void;
}

// ── Sortable chapter row ──────────────────────────────────────────────────────

function ChapterRow({
  chapter,
  index,
  scenes,
  activeSceneId,
  onSelect,
  onEdit,
  onDelete,
  onCreateScene,
  onDeleteScene,
}: {
  chapter: Chapter;
  index: number;
  scenes: Scene[];
  activeSceneId?: string;
  onSelect: (s: Scene) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateScene: () => void;
  onDeleteScene: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `chapter:${chapter.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Chapter header */}
      <div className="group flex items-center gap-1 rounded px-1 py-1 hover:bg-white/5">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-600 hover:text-gray-400 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-left"
        >
          {open ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-500" />
          )}
          <span className="truncate text-[11px] font-semibold text-gray-200">
            {chapter.title}
          </span>
          {!open && (
            <span className="ml-auto text-[10px] text-gray-600">
              {scenes.length}
            </span>
          )}
        </button>
      </div>

      {/* Scene list */}
      {open && (
        <div className="ml-5 border-l border-white/5 pl-2">
          <SortableContext
            items={scenes.map((s) => `scene:${s.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {scenes.map((scene) => (
              <SceneRow
                key={scene.id}
                scene={scene}
                isActive={scene.id === activeSceneId}
                onSelect={() => onSelect(scene)}
                onDelete={() => onDeleteScene(scene.id)}
              />
            ))}
          </SortableContext>
          <button
            type="button"
            onClick={onCreateScene}
            className="mt-1 w-full rounded border border-dashed border-white/10 py-1 text-center text-[10px] text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
          >
            + scene
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sortable scene row ────────────────────────────────────────────────────────

function SceneRow({
  scene,
  isActive,
  onSelect,
  onDelete,
}: {
  scene: Scene;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `scene:${scene.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = scene.derived?.title ?? "Untitled scene";

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-700 hover:text-gray-500 active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </span>
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 truncate rounded px-2 py-1 text-left text-[11px] transition-colors ${
          isActive
            ? "bg-indigo-500/20 text-indigo-300"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`}
      >
        {title}
      </button>
    </div>
  );
}

// ── Focus mode strip ──────────────────────────────────────────────────────────

function FocusStrip({
  chapters,
  scenes,
  hasChapters,
  activeSceneId,
  onExpand,
}: {
  chapters: Chapter[];
  scenes: Scene[];
  hasChapters: boolean;
  activeSceneId?: string;
  onExpand: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const activeChapterIndex = hasChapters
    ? chapters.findIndex((ch) =>
        scenes.some((s) => s.id === activeSceneId && s.chapterId === ch.id)
      )
    : -1;

  return (
    <div
      className="relative flex h-full flex-col items-center gap-2 py-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label="Return to navigation"
        />
      )}
      {hasChapters
        ? chapters.map((ch, i) => (
            <div
              key={ch.id}
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold transition-opacity ${
                i === activeChapterIndex
                  ? "bg-indigo-500/30 text-indigo-300 opacity-100"
                  : "bg-white/5 text-gray-600 opacity-40"
              }`}
            >
              {i + 1}
            </div>
          ))
        : scenes.map((s, i) => (
            <div
              key={s.id}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[9px] transition-opacity ${
                s.id === activeSceneId
                  ? "bg-indigo-500/30 text-indigo-300 opacity-100"
                  : "bg-white/5 text-gray-600 opacity-30"
              }`}
            >
              {i + 1}
            </div>
          ))}
      <div className="mt-auto text-[8px] uppercase tracking-widest text-gray-700 opacity-40"
           style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
        nav
      </div>
    </div>
  );
}

// ── New chapter form ──────────────────────────────────────────────────────────

function NewChapterForm({ onSubmit, onCancel }: { onSubmit: (title: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) { onSubmit(value.trim()); setValue(""); } }}
      className="mt-2 flex gap-1"
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Chapter title"
        className="h-6 text-[11px]"
      />
      <Button type="submit" size="sm" className="h-6 px-2 text-[10px]">Add</Button>
      <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={onCancel}>✕</Button>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HierarchicalSceneList({
  seriesId,
  bookId,
  chapters,
  scenes,
  hasChapters,
  focusMode,
  activeSceneId,
  onReorder,
  onCreateChapter,
  onCreateScene,
  onSelectScene,
  onEditChapter,
  onDeleteChapter,
  onDeleteScene,
}: HierarchicalSceneListProps) {
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [forcedExpanded, setForcedExpanded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isCollapsed = focusMode && !forcedExpanded;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Build current ordered items
    const chapterItems: BookItem[] = chapters.map((ch) => ({
      type: "chapter",
      id: ch.id,
      rank: ch.rank,
    }));
    const bookScenes = scenes.filter((s) => !s.chapterId);
    const sceneItems: BookItem[] = bookScenes.map((s) => ({
      type: "scene",
      id: s.id,
      rank: s.rank,
    }));

    const allItems = hasChapters ? chapterItems : sceneItems;
    const oldIndex = allItems.findIndex((item) => `${item.type}:${item.id}` === activeId);
    const newIndex = allItems.findIndex((item) => `${item.type}:${item.id}` === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...allItems];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Assign new ranks
    const prevRank = newIndex > 0 ? reordered[newIndex - 1].rank : undefined;
    const nextRank = newIndex < reordered.length - 1 ? reordered[newIndex + 1].rank : undefined;
    moved.rank = rankBetween(prevRank, nextRank);

    onReorder(reordered);
  }

  if (isCollapsed) {
    return (
      <div
        className="flex h-full w-11 flex-col overflow-hidden border-r border-white/5 bg-[#141420] transition-all duration-200"
        style={{ scrollbarWidth: "none" }}
      >
        <FocusStrip
          chapters={chapters}
          scenes={scenes}
          hasChapters={hasChapters}
          activeSceneId={activeSceneId}
          onExpand={() => setForcedExpanded(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-56 flex-col overflow-y-auto border-r border-white/5 bg-[#161625] transition-all duration-200"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a4a transparent" }}
      onMouseLeave={() => { if (focusMode) setForcedExpanded(false); }}
    >
      <div className="flex-1 p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {hasChapters ? (
            <SortableContext
              items={chapters.map((ch) => `chapter:${ch.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {chapters.map((chapter, index) => {
                const chapterScenes = scenes
                  .filter((s) => s.chapterId === chapter.id)
                  .sort((a, b) => (a.rank < b.rank ? -1 : 1));
                return (
                  <ChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    scenes={chapterScenes}
                    activeSceneId={activeSceneId}
                    onSelect={onSelectScene}
                    onEdit={() => onEditChapter(chapter)}
                    onDelete={() => onDeleteChapter(chapter.id)}
                    onCreateScene={() => onCreateScene(chapter.id)}
                    onDeleteScene={onDeleteScene}
                  />
                );
              })}
            </SortableContext>
          ) : (
            <SortableContext
              items={scenes.map((s) => `scene:${s.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {scenes
                .filter((s) => !s.chapterId)
                .sort((a, b) => (a.rank < b.rank ? -1 : 1))
                .map((scene) => (
                  <SceneRow
                    key={scene.id}
                    scene={scene}
                    isActive={scene.id === activeSceneId}
                    onSelect={() => onSelectScene(scene)}
                    onDelete={() => onDeleteScene(scene.id)}
                  />
                ))}
            </SortableContext>
          )}
        </DndContext>

        {hasChapters && (
          <>
            {showNewChapter ? (
              <NewChapterForm
                onSubmit={(title) => { onCreateChapter(title); setShowNewChapter(false); }}
                onCancel={() => setShowNewChapter(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowNewChapter(true)}
                className="mt-2 w-full rounded border border-dashed border-white/10 py-1 text-center text-[10px] text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
              >
                + chapter
              </button>
            )}
          </>
        )}

        {!hasChapters && (
          <button
            type="button"
            onClick={() => onCreateScene(undefined)}
            className="mt-2 w-full rounded border border-dashed border-white/10 py-1 text-center text-[10px] text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
          >
            + scene
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/HierarchicalSceneList.tsx
git commit -m "feat: rewrite HierarchicalSceneList as two-mode sidebar with focus/nav modes"
```

---

## Task 9: Wire `BookDetailPage`

**Files:**
- Modify: `client/src/pages/BookDetailPage.tsx`

- [ ] **Step 1: Add `focusMode` state and editor focus handlers**

In `BookDetailPage.tsx`, add state and callbacks:

```typescript
const [focusMode, setFocusMode] = useState(false);
const [activeSceneId, setActiveSceneId] = useState<string | undefined>();

function openEditScene(scene: Scene) {
  setEditingScene(scene as EditingScene);
  setSceneText(scene.text);
  setActiveSceneId(scene.id);
}
```

- [ ] **Step 2: Pass `hasChapters`, `focusMode`, `activeSceneId` to `HierarchicalSceneList`**

Find the `<HierarchicalSceneList ...>` JSX and update its props:

```tsx
<HierarchicalSceneList
  seriesId={seriesId}
  bookId={bookId}
  chapters={chapters}
  scenes={scenes}
  hasChapters={book?.hasChapters !== false}
  focusMode={focusMode}
  activeSceneId={activeSceneId}
  onReorder={handleReorder}
  onCreateChapter={(title) => createChapter.mutate({ title })}
  onCreateScene={openNewScene}
  onSelectScene={openEditScene}
  onEditChapter={openEditChapter}
  onDeleteChapter={(id) => deleteChapter.mutate(id)}
  onDeleteScene={(id) => deleteScene.mutate(id)}
/>
```

- [ ] **Step 3: Add `onFocus`/`onBlur` to the editor textarea**

Find the scene editor `<Textarea>` and add focus handlers:

```tsx
<Textarea
  value={sceneText}
  onChange={(e) => setSceneText(e.target.value)}
  onFocus={() => setFocusMode(true)}
  onBlur={() => setFocusMode(false)}
  // ... existing props
/>
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/BookDetailPage.tsx
git commit -m "feat: wire focusMode and activeSceneId to two-mode sidebar in BookDetailPage"
```

---

## Task 10: Migration Script

**Files:**
- Create: `scripts/migrate-chapters-toggle.ts`

- [ ] **Step 1: Create the migration script**

```typescript
#!/usr/bin/env -S deno run --unstable-kv --allow-net --allow-read --allow-write

/**
 * Migration: backfill hasChapters on all books and fix hybrid books.
 *
 * A "hybrid book" has both chapters AND book-level scenes in bookItemOrder.
 * Fix: create an "Uncategorized" chapter, move all book-level scenes into it.
 *
 * All books with ≥1 chapter → hasChapters = true
 * All books with 0 chapters → hasChapters = false
 *
 * Usage:
 *   deno run --unstable-kv --allow-net scripts/migrate-chapters-toggle.ts [--dry-run] [--user-id <id>]
 */

/// <reference lib="deno.unstable" />

const kv = await Deno.openKv();
const args = Deno.args;
const dryRun = args.includes("--dry-run");
const userIdArg = args.indexOf("--user-id");
const targetUserId = userIdArg !== -1 ? Number(args[userIdArg + 1]) : undefined;

if (dryRun) console.log("🔍 DRY RUN — no writes\n");
else console.log("🚀 MIGRATION — writes enabled\n");

interface Book {
  id: string;
  userId: number;
  seriesId: string;
  rank: string;
  title: string;
  hasChapters?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface BookItem {
  type: "chapter" | "scene";
  id: string;
}

interface Scene {
  id: string;
  userId: number;
  seriesId: string;
  bookId: string;
  chapterId?: string;
  rank: string;
  text: string;
  derived: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

interface Chapter {
  id: string;
  userId: number;
  seriesId: string;
  bookId: string;
  rank: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

function rankInitial(): string { return "m"; }
function rankBefore(rank: string): string { return rank + "0"; }
function rankAfter(rank: string): string { return rank + "z"; }

const stats = {
  booksScanned: 0,
  booksAlreadyMigrated: 0,
  booksSetTrue: 0,
  booksSetFalse: 0,
  hybridBooksFixed: 0,
  scenesMovedToUncategorized: 0,
  errors: [] as string[],
};

async function getAllBooks(): Promise<Book[]> {
  const books: Book[] = [];
  for await (const entry of kv.list<Book>({ prefix: ["yawt", "book"] })) {
    const book = entry.value;
    if (!book) continue;
    if (targetUserId !== undefined && book.userId !== targetUserId) continue;
    books.push(book);
  }
  return books;
}

async function getBookItems(
  userId: number,
  seriesId: string,
  bookId: string,
): Promise<{ chapters: Array<{ rank: string; id: string }>; bookScenes: Array<{ rank: string; id: string }> }> {
  const chapters: Array<{ rank: string; id: string }> = [];
  const bookScenes: Array<{ rank: string; id: string }> = [];

  for await (
    const entry of kv.list<BookItem>({
      prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId],
    })
  ) {
    const rank = entry.key[entry.key.length - 1] as string;
    if (entry.value?.type === "chapter") chapters.push({ rank, id: entry.value.id });
    if (entry.value?.type === "scene") bookScenes.push({ rank, id: entry.value.id });
  }
  return { chapters, bookScenes };
}

async function migrateBook(book: Book): Promise<void> {
  stats.booksScanned++;

  if (book.hasChapters !== undefined) {
    stats.booksAlreadyMigrated++;
    console.log(`  ✓ ${book.title} (${book.id}) — already migrated, skipping`);
    return;
  }

  const { chapters, bookScenes } = await getBookItems(book.userId, book.seriesId, book.id);
  const hasChapters = chapters.length > 0;
  const isHybrid = hasChapters && bookScenes.length > 0;

  console.log(
    `  📖 ${book.title} (${book.id}) — chapters:${chapters.length} book-scenes:${bookScenes.length}${isHybrid ? " ⚠ HYBRID" : ""}`,
  );

  if (isHybrid) {
    // Create "Uncategorized" chapter before all existing chapters
    const firstChapterRank = chapters[0]?.rank ?? rankInitial();
    const uncategorizedRank = rankBefore(firstChapterRank);
    const uncategorizedId = crypto.randomUUID();
    const now = Date.now();

    const uncategorizedChapter: Chapter = {
      id: uncategorizedId,
      userId: book.userId,
      seriesId: book.seriesId,
      bookId: book.id,
      rank: uncategorizedRank,
      title: "Uncategorized",
      createdAt: now,
      updatedAt: now,
    };

    console.log(`    → Creating "Uncategorized" chapter ${uncategorizedId}`);

    if (!dryRun) {
      await kv
        .atomic()
        .set(["yawt", "chapter", book.userId, book.seriesId, book.id, uncategorizedId], uncategorizedChapter)
        .set(["yawt", "bookItemOrder", book.userId, book.seriesId, book.id, uncategorizedRank], {
          type: "chapter",
          id: uncategorizedId,
        })
        .commit();
    }

    // Move each book-level scene into the Uncategorized chapter
    let sceneRank = rankInitial();
    for (const { rank: bookRank, id: sceneId } of bookScenes) {
      console.log(`    → Moving scene ${sceneId} into Uncategorized`);

      const sceneEntityKey = ["yawt", "scene", book.userId, book.seriesId, book.id, sceneId];
      const sceneEntry = await kv.get<Scene>(sceneEntityKey);
      if (!sceneEntry.value) {
        stats.errors.push(`Scene ${sceneId} not found`);
        continue;
      }

      const updatedScene: Scene = {
        ...sceneEntry.value,
        chapterId: uncategorizedId,
        rank: sceneRank,
        updatedAt: Date.now(),
      };

      if (!dryRun) {
        await kv
          .atomic()
          .set(sceneEntityKey, updatedScene)
          .set(
            ["yawt", "chapterSceneOrder", book.userId, book.seriesId, book.id, uncategorizedId, sceneRank, sceneId],
            1,
          )
          .delete(["yawt", "bookItemOrder", book.userId, book.seriesId, book.id, bookRank])
          .commit();
      }

      sceneRank = rankAfter(sceneRank);
      stats.scenesMovedToUncategorized++;
    }

    stats.hybridBooksFixed++;
  }

  // Set hasChapters on the book entity
  const updatedBook: Book = {
    ...book,
    hasChapters,
    updatedAt: Date.now(),
  };

  console.log(`    → Setting hasChapters=${hasChapters}`);

  if (!dryRun) {
    await kv.set(["yawt", "book", book.userId, book.seriesId, book.id], updatedBook);
  }

  if (hasChapters) stats.booksSetTrue++;
  else stats.booksSetFalse++;
}

async function main(): Promise<void> {
  console.log("═".repeat(60));
  console.log("CHAPTERS TOGGLE MIGRATION");
  console.log("═".repeat(60) + "\n");

  const books = await getAllBooks();
  console.log(`Found ${books.length} books to process\n`);

  for (const book of books) {
    try {
      await migrateBook(book);
    } catch (err) {
      stats.errors.push(`Book ${book.id}: ${String(err)}`);
      console.error(`  ✗ Error on book ${book.id}:`, err);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("SUMMARY");
  console.log("═".repeat(60));
  console.log(`Books scanned:            ${stats.booksScanned}`);
  console.log(`Already migrated:         ${stats.booksAlreadyMigrated}`);
  console.log(`Set hasChapters=true:     ${stats.booksSetTrue}`);
  console.log(`Set hasChapters=false:    ${stats.booksSetFalse}`);
  console.log(`Hybrid books fixed:       ${stats.hybridBooksFixed}`);
  console.log(`Scenes moved to Uncateg.: ${stats.scenesMovedToUncategorized}`);
  if (stats.errors.length) {
    console.log(`\n⚠ Errors (${stats.errors.length}):`);
    for (const e of stats.errors) console.log(`  - ${e}`);
  } else {
    console.log(`\n✅ No errors`);
  }

  if (dryRun) console.log("\n💡 Run without --dry-run to apply changes.");
  else console.log("\n✅ Migration complete!");

  kv.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  kv.close();
  Deno.exit(1);
});
```

- [ ] **Step 2: Run dry-run on local data**

```bash
deno run --unstable-kv --allow-net --allow-read scripts/migrate-chapters-toggle.ts --dry-run
```

Expected output: lists all books, identifies any hybrids, shows what `hasChapters` would be set to. No writes.

- [ ] **Step 3: Run migration on local data**

```bash
deno run --unstable-kv --allow-net --allow-read --allow-write scripts/migrate-chapters-toggle.ts
```

Expected output: same list but with writes. Final summary shows 0 errors.

- [ ] **Step 4: Verify a migrated book**

```bash
# Start the dev server and open a book in the browser
# Check: book with chapters shows hasChapters=true in network response
# Check: no orphaned scenes (all scenes accounted for)
```

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-chapters-toggle.ts
git commit -m "feat: add migration script to backfill hasChapters and fix hybrid books"
```

---

## Task 11: Fresh Island — Pass `hasChapters` Through

**Files:**
- Modify: `routes/series/[seriesId]/books/[bookId].tsx`
- Modify: `islands/HierarchicalSceneList.tsx`

The Fresh/Preact SSR layer is the older implementation. The React/Vite client is the primary UX, but the Fresh island must at minimum not break — and ideally passes `hasChapters` down so the SSR version behaves consistently.

- [ ] **Step 1: Read both files**

```bash
cat /Users/mykawhite/Documents/GitHub/yawt/routes/series/[seriesId]/books/[bookId].tsx
cat /Users/mykawhite/Documents/GitHub/yawt/islands/HierarchicalSceneList.tsx
```

- [ ] **Step 2: Pass `hasChapters` from the route to the island**

In `routes/series/[seriesId]/books/[bookId].tsx`, the book data is fetched and passed as props to the `<HierarchicalSceneList>` island. Add `hasChapters` to that prop:

```typescript
// After fetching book data:
hasChapters={bookData.hasChapters !== false}
```

- [ ] **Step 3: Accept and use `hasChapters` in the island**

In `islands/HierarchicalSceneList.tsx`, add `hasChapters: boolean` to the props interface and use it to conditionally hide the "+ chapter" button when `hasChapters=false`. The full two-mode sidebar behaviour is implemented in the React/Vite client; the island just needs to not show broken UI.

- [ ] **Step 4: Commit**

```bash
git add routes/series/[seriesId]/books/[bookId].tsx islands/HierarchicalSceneList.tsx
git commit -m "feat: pass hasChapters through to Fresh island"
```

---

## Task 12: Breadcrumb Fade + 409 Toast in `BookDetailPage`

**Files:**
- Modify: `client/src/pages/BookDetailPage.tsx`

- [ ] **Step 1: Add breadcrumb fade in focus mode**

Find the breadcrumb or book title header area in `BookDetailPage.tsx`. Add a conditional opacity class based on `focusMode`:

```tsx
<div className={`transition-opacity duration-200 ${focusMode ? "opacity-20" : "opacity-100"}`}>
  {/* existing breadcrumb / chapter + scene title */}
</div>
```

- [ ] **Step 2: Handle 409 from createChapter and createScene**

In `BookDetailPage.tsx`, add error handling on the mutations that can return 409. Check if `client/src/hooks/use-book-content.ts` uses `onError` callbacks; if not, add inline:

```typescript
const createChapter = useCreateChapterMutation(seriesId, bookId, {
  onError: (err) => {
    // Show a toast or inline error
    // Check what toast utility exists: grep -r "toast" client/src/
    console.error("Cannot create chapter:", err.message);
  },
});

const createScene = useCreateSceneMutation(seriesId, bookId, {
  onError: (err) => {
    console.error("Cannot create scene:", err.message);
  },
});
```

> **Note:** Before implementing, run `grep -rn "toast\|Toast\|useToast" client/src/` to find the existing toast pattern and use it instead of `console.error`.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/BookDetailPage.tsx
git commit -m "feat: breadcrumb fade in focus mode, 409 error handling on chapter/scene create"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Create a book with chapters (default)**

In the browser, create a new book. Confirm:
- `hasChapters` toggle in the create form defaults to on
- Book is created with `hasChapters: true`
- Chapter UI appears in the book detail page
- `POST /api/.../scenes` (book-level) returns 409

- [ ] **Step 2: Create a book without chapters**

Create a book with the toggle off. Confirm:
- Book is created with `hasChapters: false`
- No chapter UI in book detail
- `POST /api/.../chapters` returns 409
- Scenes can be created at book level

- [ ] **Step 3: Toggle chapters off in settings**

Open a chapter-organized book. Add at least 2 chapters with scenes. In book settings:
- Toggle shows correct chapter/scene counts in modal
- Cancel → no changes
- Confirm → all scenes moved to flat list, chapters gone, `hasChapters` now false
- Scene text is intact

- [ ] **Step 4: Toggle chapters back on**

Toggle back on from settings:
- Immediate, no modal
- `hasChapters` is now true
- `POST /api/.../chapters` no longer returns 409

- [ ] **Step 5: Test two-mode sidebar**

Open a book with chapters. Confirm:
- Sidebar shows full accordion navigation mode by default
- Click a scene to open it in the editor
- Click inside the editor textarea → sidebar smoothly collapses to pill strip
- Pills show correct chapter numbers; active chapter is highlighted
- Hover over pill strip → sidebar expands temporarily
- Press Escape or click away from editor → sidebar stays expanded

- [ ] **Step 6: Run prod migration (when ready)**

```bash
deno run --unstable-kv --allow-net --allow-read --allow-write scripts/migrate-chapters-toggle.ts --dry-run --user-id <your-prod-user-id>
# Review output, then:
deno run --unstable-kv --allow-net --allow-read --allow-write scripts/migrate-chapters-toggle.ts --user-id <your-prod-user-id>
```
