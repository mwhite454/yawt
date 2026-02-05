import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Chapter } from "@utils/story/types.ts";
import { chapterKey, chapterOrderKey } from "@utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, chapterId } = ctx.params;

    const entry = await kv.get<Chapter>(
      chapterKey(user.id, seriesId, bookId, chapterId),
    );
    if (!entry.value) return notFound("Chapter not found");
    return json({ chapter: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, chapterId } = ctx.params;

    const key = chapterKey(user.id, seriesId, bookId, chapterId);
    const entry = await kv.get<Chapter>(key);
    if (!entry.value) return notFound("Chapter not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    if (title !== undefined && !title) {
      return badRequest("Title cannot be empty");
    }

    const description = typeof body.description === "string"
      ? body.description.trim()
      : undefined;

    const updated: Chapter = {
      ...entry.value,
      title: title ?? entry.value.title,
      description: description ?? entry.value.description,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ chapter: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, chapterId } = ctx.params;

    const entry = await kv.get<Chapter>(
      chapterKey(user.id, seriesId, bookId, chapterId),
    );
    if (!entry.value) return notFound("Chapter not found");

    // Check if chapter has any scenes
    const anyScenes = await kv
      .list(
        { prefix: ["yawt", "sceneOrder", user.id, seriesId, bookId, chapterId] },
        { limit: 1 },
      )
      .next();
    if (!anyScenes.done) {
      return json(
        { error: "Chapter is not empty. Delete or move scenes first." },
        { status: 409 },
      );
    }

    const ok = await kv
      .atomic()
      .delete(chapterKey(user.id, seriesId, bookId, chapterId))
      .delete(
        chapterOrderKey(user.id, seriesId, bookId, entry.value.rank, chapterId),
      )
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to delete chapter" }, { status: 500 });
    }
    return json({ message: "Chapter deleted" }, { status: 200 });
  },
};
