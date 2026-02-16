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
import {
  chapterKey,
  chapterSceneOrderKey,
  sceneKey,
} from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";
import { deriveSceneFields } from "@utils/story/frontmatter.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, chapterId } = ctx.params;

    const chapter = await kv.get(
      chapterKey(user.id, seriesId, bookId, chapterId),
    );
    if (!chapter.value) return notFound("Chapter not found");

    // Get scenes in this chapter using chapterSceneOrderKey
    const sceneIds: string[] = [];
    for await (
      const entry of kv.list({
        prefix: [
          "yawt",
          "chapterSceneOrder",
          user.id,
          seriesId,
          bookId,
          chapterId,
        ],
      })
    ) {
      const key = entry.key as unknown[];
      const sceneId = key[key.length - 1];
      if (typeof sceneId === "string") sceneIds.push(sceneId);
    }

    const scenes: Scene[] = [];
    if (sceneIds.length) {
      const keys = sceneIds.map((id) =>
        sceneKey(user.id, seriesId, bookId, id)
      );
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Scene>[];
      for (const res of results) {
        if (res.value) scenes.push(res.value);
      }
    }

    return json({ scenes }, { status: 200 });
  },

  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, chapterId } = ctx.params;

    const chapter = await kv.get(
      chapterKey(user.id, seriesId, bookId, chapterId),
    );
    if (!chapter.value) return notFound("Chapter not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;
    const text = typeof body.text === "string" ? body.text : "";
    if (!text.trim()) return badRequest("text is required");

    // Find last rank in this chapter
    let lastRank: string | undefined;
    for await (
      const entry of kv.list(
        {
          prefix: [
            "yawt",
            "chapterSceneOrder",
            user.id,
            seriesId,
            bookId,
            chapterId,
          ],
        },
        { reverse: true, limit: 1 },
      )
    ) {
      const key = entry.key as unknown[];
      const maybeRank = key[key.length - 2];
      if (typeof maybeRank === "string") lastRank = maybeRank;
    }

    const rank = lastRank ? rankAfter(lastRank) : rankInitial();
    const now = Date.now();
    const id = crypto.randomUUID();
    const derived = deriveSceneFields(text);
    const scene: Scene = {
      id,
      userId: user.id,
      seriesId,
      bookId,
      chapterId,
      rank,
      text,
      derived,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(sceneKey(user.id, seriesId, bookId, id), scene)
      .set(
        chapterSceneOrderKey(user.id, seriesId, bookId, chapterId, rank, id),
        1,
      )
      .commit();
    if (!ok.ok) {
      return json({ error: "Failed to create scene" }, { status: 500 });
    }

    return json({ scene }, { status: 201 });
  },
};
