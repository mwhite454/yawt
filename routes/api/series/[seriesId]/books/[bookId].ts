import { Handlers } from "$fresh/server.ts";
import { kv } from "../../../../../utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "../../../../../utils/http.ts";
import type { Book } from "../../../../../utils/story/types.ts";
import { bookKey, bookOrderKey } from "../../../../../utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const { seriesId, bookId } = ctx.params;
    const entry = await kv.get<Book>(bookKey(user.id, seriesId, bookId));
    if (!entry.value) return notFound("Book not found");
    return json({ book: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const key = bookKey(user.id, seriesId, bookId);
    const entry = await kv.get<Book>(key);
    if (!entry.value) return notFound("Book not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    if (title !== undefined && !title) {
      return badRequest("Title cannot be empty");
    }

    const author = typeof body.author === "string"
      ? body.author.trim()
      : undefined;
    const publishDate = typeof body.publishDate === "string"
      ? body.publishDate.trim()
      : undefined;
    const isbn = typeof body.isbn === "string" ? body.isbn.trim() : undefined;

    const updated: Book = {
      ...entry.value,
      title: title ?? entry.value.title,
      author: author ?? entry.value.author,
      publishDate: publishDate ?? entry.value.publishDate,
      isbn: isbn ?? entry.value.isbn,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ book: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, bookId } = ctx.params;

    const entry = await kv.get<Book>(bookKey(user.id, seriesId, bookId));
    if (!entry.value) return notFound("Book not found");

    const anyScenes = await kv
      .list(
        { prefix: ["yawt", "sceneOrder", user.id, seriesId, bookId] },
        { limit: 1 },
      )
      .next();
    if (!anyScenes.done) {
      return json(
        { error: "Book is not empty. Delete scenes first." },
        { status: 409 },
      );
    }

    const ok = await kv
      .atomic()
      .delete(bookKey(user.id, seriesId, bookId))
      .delete(bookOrderKey(user.id, seriesId, entry.value.rank, bookId))
      .commit();

    if (!ok.ok) {
      return json({ error: "Failed to delete book" }, { status: 500 });
    }
    return json({ message: "Book deleted" }, { status: 200 });
  },
};
