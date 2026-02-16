#!/usr/bin/env -S deno run --unstable-kv --allow-net --allow-read --allow-write

/**
 * Migration script for converting from old chapter/scene order indexes
 * to the new unified book item order system.
 *
 * OLD indexes:
 * - chapterOrder: ["yawt", "chapterOrder", userId, seriesId, bookId, rank, chapterId] → 1
 * - sceneOrder: ["yawt", "sceneOrder", userId, seriesId, bookId, chapterId?, rank, sceneId] → 1
 *   - Book-level scenes: chapterId is undefined, so key was:
 *     ["yawt", "sceneOrder", userId, seriesId, bookId, rank, sceneId]
 *   - Chapter scenes: chapterId is defined, so key was:
 *     ["yawt", "sceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId]
 *
 * NEW indexes:
 * - bookItemOrder: ["yawt", "bookItemOrder", userId, seriesId, bookId, rank] → { type: "chapter" | "scene", id }
 * - chapterSceneOrder: ["yawt", "chapterSceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId] → 1
 *
 * Usage:
 *   deno run --unstable-kv --allow-net scripts/migrate-book-item-order.ts [--dry-run]
 *
 * Options:
 *   --dry-run   Preview what would be migrated without making changes
 */

const kv = await Deno.openKv();

const args = Deno.args;
const dryRun = args.includes("--dry-run");

if (dryRun) {
  console.log("🔍 DRY RUN MODE - No changes will be made\n");
} else {
  console.log("🚀 MIGRATION MODE - Changes will be applied\n");
}

interface MigrationStats {
  chapterOrderEntriesFound: number;
  chapterOrderMigrated: number;
  sceneOrderEntriesFound: number;
  bookLevelScenesMigrated: number;
  chapterScenesMigrated: number;
  oldEntriesDeleted: number;
  errors: string[];
}

const stats: MigrationStats = {
  chapterOrderEntriesFound: 0,
  chapterOrderMigrated: 0,
  sceneOrderEntriesFound: 0,
  bookLevelScenesMigrated: 0,
  chapterScenesMigrated: 0,
  oldEntriesDeleted: 0,
  errors: [],
};

// Type definitions for clarity
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

// Helper to extract parts from old keys
function parseChapterOrderKey(key: Deno.KvKey): {
  userId: number;
  seriesId: string;
  bookId: string;
  rank: string;
  chapterId: string;
} | null {
  // ["yawt", "chapterOrder", userId, seriesId, bookId, rank, chapterId]
  if (key.length !== 7 || key[0] !== "yawt" || key[1] !== "chapterOrder") {
    return null;
  }
  return {
    userId: key[2] as number,
    seriesId: key[3] as string,
    bookId: key[4] as string,
    rank: key[5] as string,
    chapterId: key[6] as string,
  };
}

function parseSceneOrderKey(key: Deno.KvKey): {
  userId: number;
  seriesId: string;
  bookId: string;
  chapterId: string | undefined;
  rank: string;
  sceneId: string;
} | null {
  // Book-level: ["yawt", "sceneOrder", userId, seriesId, bookId, rank, sceneId] (7 elements)
  // Chapter: ["yawt", "sceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId] (8 elements)
  if (key[0] !== "yawt" || key[1] !== "sceneOrder") {
    return null;
  }

  if (key.length === 7) {
    // Book-level scene
    return {
      userId: key[2] as number,
      seriesId: key[3] as string,
      bookId: key[4] as string,
      chapterId: undefined,
      rank: key[5] as string,
      sceneId: key[6] as string,
    };
  } else if (key.length === 8) {
    // Chapter scene
    return {
      userId: key[2] as number,
      seriesId: key[3] as string,
      bookId: key[4] as string,
      chapterId: key[5] as string,
      rank: key[6] as string,
      sceneId: key[7] as string,
    };
  }

  return null;
}

// Check if new indexes already exist for a book (currently unused but kept for reference)
async function _hasNewIndexes(
  userId: number,
  seriesId: string,
  bookId: string,
): Promise<boolean> {
  for await (const _entry of kv.list(
    {
      prefix: ["yawt", "bookItemOrder", userId, seriesId, bookId],
    },
    { limit: 1 },
  )) {
    return true;
  }
  return false;
}

// Migrate chapterOrder entries
async function migrateChapterOrderEntries(): Promise<void> {
  console.log("📖 Migrating chapterOrder entries...\n");

  const entries: Array<{
    key: Deno.KvKey;
    parsed: NonNullable<ReturnType<typeof parseChapterOrderKey>>;
  }> = [];

  for await (const entry of kv.list({ prefix: ["yawt", "chapterOrder"] })) {
    stats.chapterOrderEntriesFound++;
    const parsed = parseChapterOrderKey(entry.key);
    if (parsed) {
      entries.push({ key: entry.key, parsed });
    } else {
      stats.errors.push(
        `Invalid chapterOrder key: ${JSON.stringify(entry.key)}`,
      );
    }
  }

  console.log(`   Found ${entries.length} chapterOrder entries\n`);

  for (const { key, parsed } of entries) {
    const { userId, seriesId, bookId, rank, chapterId } = parsed;

    const newKey = ["yawt", "bookItemOrder", userId, seriesId, bookId, rank];
    const newValue: BookItem = { type: "chapter", id: chapterId };

    console.log(`   Chapter: ${chapterId}`);
    console.log(`   Old key: ${JSON.stringify(key)}`);
    console.log(`   New key: ${JSON.stringify(newKey)}`);
    console.log(`   New value: ${JSON.stringify(newValue)}\n`);

    if (!dryRun) {
      const result = await kv
        .atomic()
        .set(newKey, newValue)
        .delete(key)
        .commit();

      if (result.ok) {
        stats.chapterOrderMigrated++;
        stats.oldEntriesDeleted++;
      } else {
        stats.errors.push(`Failed to migrate chapter ${chapterId}`);
      }
    } else {
      stats.chapterOrderMigrated++;
    }
  }
}

// Migrate sceneOrder entries
async function migrateSceneOrderEntries(): Promise<void> {
  console.log("🎬 Migrating sceneOrder entries...\n");

  const entries: Array<{
    key: Deno.KvKey;
    parsed: NonNullable<ReturnType<typeof parseSceneOrderKey>>;
  }> = [];

  for await (const entry of kv.list({ prefix: ["yawt", "sceneOrder"] })) {
    stats.sceneOrderEntriesFound++;
    const parsed = parseSceneOrderKey(entry.key);
    if (parsed) {
      entries.push({ key: entry.key, parsed });
    } else {
      stats.errors.push(`Invalid sceneOrder key: ${JSON.stringify(entry.key)}`);
    }
  }

  console.log(`   Found ${entries.length} sceneOrder entries\n`);

  for (const { key, parsed } of entries) {
    const { userId, seriesId, bookId, chapterId, rank, sceneId } = parsed;

    if (chapterId) {
      // Scene belongs to a chapter - migrate to chapterSceneOrder
      const newKey = [
        "yawt",
        "chapterSceneOrder",
        userId,
        seriesId,
        bookId,
        chapterId,
        rank,
        sceneId,
      ];

      console.log(`   Scene (in chapter ${chapterId}): ${sceneId}`);
      console.log(`   Old key: ${JSON.stringify(key)}`);
      console.log(`   New key: ${JSON.stringify(newKey)}\n`);

      if (!dryRun) {
        const result = await kv.atomic().set(newKey, 1).delete(key).commit();

        if (result.ok) {
          stats.chapterScenesMigrated++;
          stats.oldEntriesDeleted++;
        } else {
          stats.errors.push(`Failed to migrate chapter scene ${sceneId}`);
        }
      } else {
        stats.chapterScenesMigrated++;
      }
    } else {
      // Book-level scene - migrate to bookItemOrder
      const newKey = ["yawt", "bookItemOrder", userId, seriesId, bookId, rank];
      const newValue: BookItem = { type: "scene", id: sceneId };

      console.log(`   Scene (book-level): ${sceneId}`);
      console.log(`   Old key: ${JSON.stringify(key)}`);
      console.log(`   New key: ${JSON.stringify(newKey)}`);
      console.log(`   New value: ${JSON.stringify(newValue)}\n`);

      if (!dryRun) {
        const result = await kv
          .atomic()
          .set(newKey, newValue)
          .delete(key)
          .commit();

        if (result.ok) {
          stats.bookLevelScenesMigrated++;
          stats.oldEntriesDeleted++;
        } else {
          stats.errors.push(`Failed to migrate book-level scene ${sceneId}`);
        }
      } else {
        stats.bookLevelScenesMigrated++;
      }
    }
  }
}

// Verify scene records have correct chapterId set
async function verifySceneRecords(): Promise<void> {
  console.log("🔍 Verifying scene records match their order entries...\n");

  let verified = 0;
  let mismatches = 0;

  // Check chapterSceneOrder entries match scene.chapterId
  for await (const entry of kv.list({
    prefix: ["yawt", "chapterSceneOrder"],
  })) {
    const key = entry.key;
    // ["yawt", "chapterSceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId]
    if (key.length === 8) {
      const userId = key[2] as number;
      const seriesId = key[3] as string;
      const bookId = key[4] as string;
      const expectedChapterId = key[5] as string;
      const sceneId = key[7] as string;

      const sceneKey = ["yawt", "scene", userId, seriesId, bookId, sceneId];
      const sceneEntry = await kv.get<Scene>(sceneKey);

      if (sceneEntry.value) {
        if (sceneEntry.value.chapterId !== expectedChapterId) {
          console.log(
            `   ⚠️  Scene ${sceneId} has chapterId=${sceneEntry.value.chapterId} but order entry says ${expectedChapterId}`,
          );
          mismatches++;

          if (!dryRun) {
            // Fix the scene record
            const updated: Scene = {
              ...sceneEntry.value,
              chapterId: expectedChapterId,
              updatedAt: Date.now(),
            };
            await kv.set(sceneKey, updated);
            console.log(
              `       Fixed scene record to have chapterId=${expectedChapterId}`,
            );
          }
        } else {
          verified++;
        }
      }
    }
  }

  // Check bookItemOrder scene entries match scene.chapterId being undefined
  for await (const entry of kv.list<BookItem>({
    prefix: ["yawt", "bookItemOrder"],
  })) {
    if (entry.value && entry.value.type === "scene") {
      const key = entry.key;
      // ["yawt", "bookItemOrder", userId, seriesId, bookId, rank]
      const userId = key[2] as number;
      const seriesId = key[3] as string;
      const bookId = key[4] as string;
      const sceneId = entry.value.id;

      const sceneKey = ["yawt", "scene", userId, seriesId, bookId, sceneId];
      const sceneEntry = await kv.get<Scene>(sceneKey);

      if (sceneEntry.value) {
        if (sceneEntry.value.chapterId !== undefined) {
          console.log(
            `   ⚠️  Book-level scene ${sceneId} has chapterId=${sceneEntry.value.chapterId} but should be undefined`,
          );
          mismatches++;

          if (!dryRun) {
            // Fix the scene record
            const { chapterId: _, ...rest } = sceneEntry.value;
            const updated: Scene = {
              ...rest,
              updatedAt: Date.now(),
            } as Scene;
            await kv.set(sceneKey, updated);
            console.log(
              `       Fixed scene record to have chapterId=undefined`,
            );
          }
        } else {
          verified++;
        }
      }
    }
  }

  console.log(`   ✓ Verified ${verified} scene records`);
  if (mismatches > 0) {
    console.log(
      `   ⚠️  Found ${mismatches} mismatches${
        dryRun ? " (would be fixed)" : " (fixed)"
      }`,
    );
  }
  console.log();
}

// Print summary
function printSummary(): void {
  console.log("═".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("═".repeat(60));
  console.log(`\nOld entries found:`);
  console.log(`  - chapterOrder: ${stats.chapterOrderEntriesFound}`);
  console.log(`  - sceneOrder: ${stats.sceneOrderEntriesFound}`);

  console.log(`\nNew entries ${dryRun ? "would be " : ""}created:`);
  console.log(`  - bookItemOrder (chapters): ${stats.chapterOrderMigrated}`);
  console.log(`  - bookItemOrder (scenes): ${stats.bookLevelScenesMigrated}`);
  console.log(`  - chapterSceneOrder: ${stats.chapterScenesMigrated}`);

  if (!dryRun) {
    console.log(`\nOld entries deleted: ${stats.oldEntriesDeleted}`);
  }

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    for (const error of stats.errors) {
      console.log(`  - ${error}`);
    }
  } else {
    console.log(`\n✅ No errors`);
  }

  console.log();
}

// Main execution
async function main(): Promise<void> {
  console.log("═".repeat(60));
  console.log("BOOK ITEM ORDER MIGRATION");
  console.log("═".repeat(60));
  console.log();

  // Check for existing old entries
  let hasOldChapterOrder = false;
  let hasOldSceneOrder = false;

  for await (const _ of kv.list(
    { prefix: ["yawt", "chapterOrder"] },
    { limit: 1 },
  )) {
    hasOldChapterOrder = true;
    break;
  }

  for await (const _ of kv.list(
    { prefix: ["yawt", "sceneOrder"] },
    { limit: 1 },
  )) {
    hasOldSceneOrder = true;
    break;
  }

  if (!hasOldChapterOrder && !hasOldSceneOrder) {
    console.log(
      "✅ No old order entries found - migration not needed or already complete.\n",
    );

    // Still verify scene records
    await verifySceneRecords();

    kv.close();
    return;
  }

  if (hasOldChapterOrder) {
    await migrateChapterOrderEntries();
  }

  if (hasOldSceneOrder) {
    await migrateSceneOrderEntries();
  }

  // Verify scene records match order entries
  await verifySceneRecords();

  printSummary();

  if (dryRun) {
    console.log("💡 Run without --dry-run to apply changes.\n");
  } else {
    console.log("✅ Migration complete!\n");
  }

  kv.close();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  kv.close();
  Deno.exit(1);
});
