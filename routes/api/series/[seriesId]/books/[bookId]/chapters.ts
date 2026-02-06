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
import {
  bookKey,
  chapterKey,
  chapterOrderKey,
} from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const book = await kv.get(bookKey(user.id, seriesId, bookId));
    if (!book.value) return notFound("Book not found");

    const orderEntries = kv.list({
      prefix: ["yawt", "chapterOrder", user.id, seriesId, bookId],
    });

    const chapterIds: string[] = [];
    for await (const entry of orderEntries) {
      const key = entry.key as unknown[];
      const chapterId = key[key.length - 1];
      if (typeof chapterId === "string") chapterIds.push(chapterId);
    }

    const chapters: Chapter[] = [];
    if (chapterIds.length) {
      const keys = chapterIds.map((id) =>
        chapterKey(user.id, seriesId, bookId, id)
      );
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Chapter>[];
      for (const res of results) {
        if (res.value) chapters.push(res.value);
      }
    }

    return json({ chapters }, { status: 200 });
  },

  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const book = await kv.get(bookKey(user.id, seriesId, bookId));
    if (!book.value) return notFound("Book not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return badRequest("title is required");

    const description = typeof body.description === "string"
      ? body.description.trim()
      : undefined;

    let lastRank: string | undefined;
    for await (
      const entry of kv.list(
        { prefix: ["yawt", "chapterOrder", user.id, seriesId, bookId] },
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
    const chapter: Chapter = {
      id,
      userId: user.id,
      seriesId,
      bookId,
      rank,
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(chapterKey(user.id, seriesId, bookId, id), chapter)
      .set(chapterOrderKey(user.id, seriesId, bookId, rank, id), 1)
      .commit();
    if (!ok.ok) {
      return json({ error: "Failed to create chapter" }, { status: 500 });
    }

    return json({ chapter }, { status: 201 });
  },
};
