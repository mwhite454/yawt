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
import { sceneKey, sceneOrderKey } from "@utils/story/keys.ts";
import { rankBetween } from "@utils/story/rank.ts";

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

    const beforeSceneId = typeof body.beforeSceneId === "string"
      ? body.beforeSceneId
      : undefined;
    const afterSceneId = typeof body.afterSceneId === "string"
      ? body.afterSceneId
      : undefined;

    if (!beforeSceneId && !afterSceneId) {
      return badRequest("beforeSceneId or afterSceneId is required");
    }
    if (beforeSceneId && beforeSceneId === sceneId) {
      return badRequest("beforeSceneId cannot be the same as sceneId");
    }
    if (afterSceneId && afterSceneId === sceneId) {
      return badRequest("afterSceneId cannot be the same as sceneId");
    }

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

    const lower = after?.value?.rank ?? null;
    const upper = before?.value?.rank ?? null;
    const newRank = rankBetween(lower, upper);

    const updated: Scene = {
      ...entry.value,
      rank: newRank,
      updatedAt: Date.now(),
    };

    const ok = await kv
      .atomic()
      .delete(
        sceneOrderKey(user.id, seriesId, bookId, entry.value.rank, sceneId),
      )
      .set(sceneKey(user.id, seriesId, bookId, sceneId), updated)
      .set(sceneOrderKey(user.id, seriesId, bookId, newRank, sceneId), 1)
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to reorder scene" }, { status: 500 });
    }
    return json({ scene: updated }, { status: 200 });
  },
};
