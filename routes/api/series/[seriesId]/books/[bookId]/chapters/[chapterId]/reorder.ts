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
import { rankBetween } from "@utils/story/rank.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId, chapterId } = ctx.params;

    const entry = await kv.get<Chapter>(
      chapterKey(user.id, seriesId, bookId, chapterId),
    );
    if (!entry.value) return notFound("Chapter not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const beforeChapterId = typeof body.beforeChapterId === "string"
      ? body.beforeChapterId
      : undefined;
    const afterChapterId = typeof body.afterChapterId === "string"
      ? body.afterChapterId
      : undefined;

    if (!beforeChapterId && !afterChapterId) {
      return badRequest("beforeChapterId or afterChapterId is required");
    }
    if (beforeChapterId && beforeChapterId === chapterId) {
      return badRequest("beforeChapterId cannot be the same as chapterId");
    }
    if (afterChapterId && afterChapterId === chapterId) {
      return badRequest("afterChapterId cannot be the same as chapterId");
    }

    const before = beforeChapterId
      ? await kv.get<Chapter>(
        chapterKey(user.id, seriesId, bookId, beforeChapterId),
      )
      : null;
    const after = afterChapterId
      ? await kv.get<Chapter>(
        chapterKey(user.id, seriesId, bookId, afterChapterId),
      )
      : null;

    if (beforeChapterId && !before?.value) {
      return notFound("beforeChapterId not found");
    }
    if (afterChapterId && !after?.value) {
      return notFound("afterChapterId not found");
    }

    const lower = after?.value?.rank ?? null;
    const upper = before?.value?.rank ?? null;
    const newRank = rankBetween(lower, upper);

    const updated: Chapter = {
      ...entry.value,
      rank: newRank,
      updatedAt: Date.now(),
    };

    const ok = await kv
      .atomic()
      .delete(
        chapterOrderKey(user.id, seriesId, bookId, entry.value.rank, chapterId),
      )
      .set(chapterKey(user.id, seriesId, bookId, chapterId), updated)
      .set(chapterOrderKey(user.id, seriesId, bookId, newRank, chapterId), 1)
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to reorder chapter" }, { status: 500 });
    }
    return json({ chapter: updated }, { status: 200 });
  },
};
