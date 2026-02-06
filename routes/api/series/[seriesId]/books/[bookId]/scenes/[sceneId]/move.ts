import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Scene } from "@utils/story/types.ts";
import { chapterKey, sceneKey, sceneOrderKey } from "@utils/story/keys.ts";
import { rankAfter, rankBefore, rankBetween, rankInitial } from "@utils/story/rank.ts";

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
      return badRequest("targetChapterId is required (use null for book-level)");
    }
    const rawTargetChapterId = (body as { targetChapterId: unknown }).targetChapterId;
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

    // Determine the new rank based on the position
    let newRank: string;

    if (beforeSceneId || afterSceneId) {
      // Position relative to another scene
      const before = beforeSceneId
        ? await kv.get<Scene>(sceneKey(user.id, seriesId, bookId, beforeSceneId))
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
      const prefix = targetChapterId
        ? ["yawt", "sceneOrder", user.id, seriesId, bookId, targetChapterId]
        : ["yawt", "sceneOrder", user.id, seriesId, bookId];

      for await (
        const kvEntry of kv.list(
          { prefix },
          { reverse: true, limit: 1 },
        )
      ) {
        const key = kvEntry.key as unknown[];
        const maybeRank = key[key.length - 2];
        if (typeof maybeRank === "string") lastRank = maybeRank;
      }

      newRank = lastRank ? rankAfter(lastRank) : rankInitial();
    }

    const updated: Scene = {
      ...entry.value,
      chapterId: targetChapterId,
      rank: newRank,
      updatedAt: Date.now(),
    };

    // Use atomic operation to ensure consistency
    const ok = await kv
      .atomic()
      // Delete old order key
      .delete(
        sceneOrderKey(
          user.id,
          seriesId,
          bookId,
          entry.value.rank,
          sceneId,
          entry.value.chapterId,
        ),
      )
      // Update scene with new chapterId and rank
      .set(sceneKey(user.id, seriesId, bookId, sceneId), updated)
      // Create new order key
      .set(
        sceneOrderKey(
          user.id,
          seriesId,
          bookId,
          newRank,
          sceneId,
          targetChapterId,
        ),
        1,
      )
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to move scene" }, { status: 500 });
    }
    return json({ scene: updated }, { status: 200 });
  },
};
