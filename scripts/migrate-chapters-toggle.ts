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
