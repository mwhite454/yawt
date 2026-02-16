import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { BookItem, Chapter, Scene } from "@utils/story/types.ts";
import { bookItemOrderKey, chapterKey, sceneKey } from "@utils/story/keys.ts";
import { rankAfter, rankBetween, rankInitial } from "@utils/story/rank.ts";

/**
 * Unified reorder endpoint for book-level items (chapters and book-level scenes).
 *
 * POST body:
 * - itemType: "chapter" | "scene" - the type of item being moved
 * - itemId: string - the ID of the item being moved
 * - afterRank?: string - the rank of the item to place after (null for start)
 * - beforeRank?: string - the rank of the item to place before (null for end)
 *
 * At least one of afterRank or beforeRank must be provided, unless this is the
 * first item in the book (detected automatically).
 */
export const handler: Handlers = {
  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    // Validate item type
    const itemType = body.itemType as string;
    if (itemType !== "chapter" && itemType !== "scene") {
      return badRequest("itemType must be 'chapter' or 'scene'");
    }

    // Validate item ID
    const itemId = body.itemId as string;
    if (!itemId || typeof itemId !== "string") {
      return badRequest("itemId is required");
    }

    // Verify the item exists and get its current rank
    let currentRank: string | null = null;
    if (itemType === "chapter") {
      const entry = await kv.get<Chapter>(
        chapterKey(user.id, seriesId, bookId, itemId),
      );
      if (!entry.value) return notFound("Chapter not found");
      currentRank = entry.value.rank;
    } else {
      const entry = await kv.get<Scene>(
        sceneKey(user.id, seriesId, bookId, itemId),
      );
      if (!entry.value) return notFound("Scene not found");
      // Only book-level scenes can be reordered via this endpoint
      if (entry.value.chapterId) {
        return badRequest(
          "Scene belongs to a chapter - use scene move endpoint",
        );
      }
      currentRank = entry.value.rank;
    }

    // Get position parameters
    const afterRank = typeof body.afterRank === "string"
      ? body.afterRank
      : null;
    const beforeRank = typeof body.beforeRank === "string"
      ? body.beforeRank
      : null;

    // Determine the new rank
    let newRank: string;

    if (afterRank || beforeRank) {
      // Position between two items or at start/end
      newRank = rankBetween(afterRank, beforeRank);
    } else {
      // No position specified - append to end
      let lastRank: string | undefined;
      for await (
        const entry of kv.list<BookItem>(
          { prefix: ["yawt", "bookItemOrder", user.id, seriesId, bookId] },
          { reverse: true, limit: 1 },
        )
      ) {
        const key = entry.key as unknown[];
        const maybeRank = key[key.length - 1];
        if (typeof maybeRank === "string") lastRank = maybeRank;
      }
      newRank = lastRank ? rankAfter(lastRank) : rankInitial();
    }

    // Build atomic operation
    const atomic = kv.atomic();

    // Delete old order entry if it exists
    if (currentRank) {
      atomic.delete(bookItemOrderKey(user.id, seriesId, bookId, currentRank));
    }

    // Create new order entry
    const bookItem: BookItem = { type: itemType, id: itemId };
    atomic.set(bookItemOrderKey(user.id, seriesId, bookId, newRank), bookItem);

    // Update the item's rank
    if (itemType === "chapter") {
      const entry = await kv.get<Chapter>(
        chapterKey(user.id, seriesId, bookId, itemId),
      );
      if (entry.value) {
        const updated: Chapter = {
          ...entry.value,
          rank: newRank,
          updatedAt: Date.now(),
        };
        atomic.set(chapterKey(user.id, seriesId, bookId, itemId), updated);
      }
    } else {
      const entry = await kv.get<Scene>(
        sceneKey(user.id, seriesId, bookId, itemId),
      );
      if (entry.value) {
        const updated: Scene = {
          ...entry.value,
          rank: newRank,
          updatedAt: Date.now(),
        };
        atomic.set(sceneKey(user.id, seriesId, bookId, itemId), updated);
      }
    }

    const ok = await atomic.commit();
    if (!ok.ok) {
      return json({ error: "Failed to reorder item" }, { status: 500 });
    }

    return json({ rank: newRank, itemType, itemId }, { status: 200 });
  },
};
