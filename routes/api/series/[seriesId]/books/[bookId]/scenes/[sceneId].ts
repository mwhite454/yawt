import { Handlers } from "$fresh/server.ts";
import { kv } from "../../../../../../../utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "../../../../../../../utils/http.ts";
import type { Scene } from "../../../../../../../utils/story/types.ts";
import {
  sceneKey,
  sceneOrderKey,
} from "../../../../../../../utils/story/keys.ts";
import { deriveSceneFields } from "../../../../../../../utils/story/frontmatter.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, sceneId } = ctx.params;

    const entry = await kv.get<Scene>(
      sceneKey(user.id, seriesId, bookId, sceneId),
    );
    if (!entry.value) return notFound("Scene not found");
    return json({ scene: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, sceneId } = ctx.params;

    const key = sceneKey(user.id, seriesId, bookId, sceneId);
    const entry = await kv.get<Scene>(key);
    if (!entry.value) return notFound("Scene not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;
    const text = typeof body.text === "string" ? body.text : undefined;
    if (text === undefined) return badRequest("text is required");

    const updated: Scene = {
      ...entry.value,
      text,
      derived: deriveSceneFields(text),
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ scene: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, sceneId } = ctx.params;

    const entry = await kv.get<Scene>(
      sceneKey(user.id, seriesId, bookId, sceneId),
    );
    if (!entry.value) return notFound("Scene not found");

    const ok = await kv
      .atomic()
      .delete(sceneKey(user.id, seriesId, bookId, sceneId))
      .delete(
        sceneOrderKey(user.id, seriesId, bookId, entry.value.rank, sceneId),
      )
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to delete scene" }, { status: 500 });
    }
    return json({ message: "Scene deleted" }, { status: 200 });
  },
};
