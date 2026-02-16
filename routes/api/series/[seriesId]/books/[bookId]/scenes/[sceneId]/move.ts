import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { BookItem, Scene } from "@utils/story/types.ts";
import {
  bookItemOrderKey,
  chapterKey,
  chapterSceneOrderKey,
  sceneKey,
} from "@utils/story/keys.ts";
import { rankAfter, rankBetween, rankInitial } from "@utils/story/rank.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, sceneId } = ctx.params;

    const entry = await kv.get<Scene>(
      sceneKey(user.id, seriesId, bookId, sceneId),
    );
    if (!entry.value) return notFound("Scene not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    // Validate required target chapter field: must exist (string or null)
    if (!Object.prototype.hasOwnProperty.call(body, "targetChapterId")) {
      return badRequest(
        "targetChapterId is required (use null for book-level)",
      );
    }
    const rawTargetChapterId = (body as { targetChapterId: unknown })
      .targetChapterId;
    if (rawTargetChapterId !== null && typeof rawTargetChapterId !== "string") {
      return badRequest("targetChapterId must be a string or null");
    }

    // Target chapter (null => book-level, string => chapter)
    const targetChapterId = rawTargetChapterId === null
      ? undefined
      : rawTargetChapterId;

    // Validate target chapter exists if provided
    if (targetChapterId !== undefined) {
      const chapterEntry = await kv.get(
        chapterKey(user.id, seriesId, bookId, targetChapterId),
      );
      if (!chapterEntry.value) {
        return notFound("Target chapter not found");
      }
    }

    // Get position parameters
    const beforeSceneId = typeof body.beforeSceneId === "string"
      ? body.beforeSceneId
      : undefined;
    const afterSceneId = typeof body.afterSceneId === "string"
      ? body.afterSceneId
      : undefined;

    if (beforeSceneId && beforeSceneId === sceneId) {
      return badRequest("beforeSceneId cannot be the same as sceneId");
    }
    if (afterSceneId && afterSceneId === sceneId) {
      return badRequest("afterSceneId cannot be the same as sceneId");
    }

    const currentChapterId = entry.value.chapterId;
    const movingToBookLevel = targetChapterId === undefined;
    const movingFromBookLevel = currentChapterId === undefined;

    // Determine the new rank based on the position
    let newRank: string;

    if (beforeSceneId || afterSceneId) {
      // Position relative to another scene
      const before = beforeSceneId
        ? await kv.get<Scene>(
          sceneKey(user.id, seriesId, bookId, beforeSceneId),
        )
        : null;
      const after = afterSceneId
        ? await kv.get<Scene>(sceneKey(user.id, seriesId, bookId, afterSceneId))
        : null;

      if (beforeSceneId && !before?.value) {
        return notFound("beforeSceneId not found");
      }
      if (afterSceneId && !after?.value) {
        return notFound("afterSceneId not found");
      }

      // Verify that the before/after scenes are in the target chapter
      if (before?.value && before.value.chapterId !== targetChapterId) {
        return badRequest("beforeSceneId is not in the target chapter");
      }
      if (after?.value && after.value.chapterId !== targetChapterId) {
        return badRequest("afterSceneId is not in the target chapter");
      }

      const lower = after?.value?.rank ?? null;
      const upper = before?.value?.rank ?? null;
      newRank = rankBetween(lower, upper);
    } else {
      // No position specified - append to end of target chapter/book
      let lastRank: string | undefined;

      if (targetChapterId) {
        // Target is a chapter - find last scene in that chapter
        for await (
          const kvEntry of kv.list(
            {
              prefix: [
                "yawt",
                "chapterSceneOrder",
                user.id,
                seriesId,
                bookId,
                targetChapterId,
              ],
            },
            { reverse: true, limit: 1 },
          )
        ) {
          const key = kvEntry.key as unknown[];
          const maybeRank = key[key.length - 2];
          if (typeof maybeRank === "string") lastRank = maybeRank;
        }
      } else {
        // Target is book-level - find last item in book item order that is a scene
        for await (
          const kvEntry of kv.list<BookItem>(
            { prefix: ["yawt", "bookItemOrder", user.id, seriesId, bookId] },
            { reverse: true },
          )
        ) {
          const item = kvEntry.value;
          if (item && item.type === "scene") {
            const key = kvEntry.key as unknown[];
            const maybeRank = key[key.length - 1];
            if (typeof maybeRank === "string") {
              lastRank = maybeRank;
              break;
            }
          }
        }
      }

      newRank = lastRank ? rankAfter(lastRank) : rankInitial();
    }

    const updated: Scene = {
      ...entry.value,
      chapterId: targetChapterId,
      rank: newRank,
      updatedAt: Date.now(),
    };

    // Build atomic operation
    const atomic = kv.atomic();

    // Delete old order key
    if (movingFromBookLevel) {
      // Was at book level - delete from book item order
      atomic.delete(
        bookItemOrderKey(user.id, seriesId, bookId, entry.value.rank),
      );
    } else {
      // Was in a chapter - delete from chapter scene order
      atomic.delete(
        chapterSceneOrderKey(
          user.id,
          seriesId,
          bookId,
          currentChapterId!,
          entry.value.rank,
          sceneId,
        ),
      );
    }

    // Update scene with new chapterId and rank
    atomic.set(sceneKey(user.id, seriesId, bookId, sceneId), updated);

    // Create new order key
    if (movingToBookLevel) {
      // Moving to book level - add to book item order
      const bookItem: BookItem = { type: "scene", id: sceneId };
      atomic.set(
        bookItemOrderKey(user.id, seriesId, bookId, newRank),
        bookItem,
      );
    } else {
      // Moving to a chapter - add to chapter scene order
      atomic.set(
        chapterSceneOrderKey(
          user.id,
          seriesId,
          bookId,
          targetChapterId!,
          newRank,
          sceneId,
        ),
        1,
      );
    }

    const ok = await atomic.commit();

    if (!ok.ok) {
      return json({ error: "Failed to move scene" }, { status: 500 });
    }
    return json({ scene: updated }, { status: 200 });
  },
};
