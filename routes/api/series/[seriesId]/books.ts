import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser } from "@utils/http.ts";
import type { Book } from "@utils/story/types.ts";
import { bookKey, bookOrderKey, seriesKey } from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const seriesId = ctx.params.seriesId;
    const series = await kv.get(seriesKey(user.id, seriesId));
    if (!series.value) {
      return json({ error: "Series not found" }, { status: 404 });
    }

    const orderEntries = kv.list({
      prefix: ["yawt", "bookOrder", user.id, seriesId],
    });

    const bookIds: string[] = [];
    for await (const entry of orderEntries) {
      const key = entry.key as unknown[];
      const bookId = key[key.length - 1];
      if (typeof bookId === "string") bookIds.push(bookId);
    }

    const books: Book[] = [];
    if (bookIds.length) {
      const keys = bookIds.map((id) => bookKey(user.id, seriesId, id));
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Book>[];
      for (const res of results) {
        if (res.value) books.push(res.value);
      }
    }

    return json({ books }, { status: 200 });
  },

  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const seriesId = ctx.params.seriesId;

    const series = await kv.get(seriesKey(user.id, seriesId));
    if (!series.value) {
      return json({ error: "Series not found" }, { status: 404 });
    }

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return badRequest("Title is required");

    const author = typeof body.author === "string"
      ? body.author.trim()
      : undefined;
    const publishDate = typeof body.publishDate === "string"
      ? body.publishDate.trim()
      : undefined;
    const isbn = typeof body.isbn === "string" ? body.isbn.trim() : undefined;

    let lastRank: string | undefined;
    for await (
      const entry of kv.list(
        { prefix: ["yawt", "bookOrder", user.id, seriesId] },
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
    const book: Book = {
      id,
      userId: user.id,
      seriesId,
      rank,
      title,
      author,
      publishDate,
      isbn,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(bookKey(user.id, seriesId, id), book)
      .set(bookOrderKey(user.id, seriesId, rank, id), 1)
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to create book" }, { status: 500 });
    }

    return json({ book }, { status: 201 });
  },
};
