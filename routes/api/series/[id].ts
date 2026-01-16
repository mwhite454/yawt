import { Handlers } from "$fresh/server.ts";
import { kv } from "../../../utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "../../../utils/http.ts";
import type { Series } from "../../../utils/story/types.ts";
import { seriesKey } from "../../../utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const entry = await kv.get<Series>(seriesKey(user.id, ctx.params.id));
    if (!entry.value) return notFound("Series not found");
    return json({ series: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const key = seriesKey(user.id, ctx.params.id);
    const entry = await kv.get<Series>(key);
    if (!entry.value) return notFound("Series not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    const description = typeof body.description === "string"
      ? body.description.trim()
      : undefined;

    if (title !== undefined && !title) {
      return badRequest("Title cannot be empty");
    }

    const updated: Series = {
      ...entry.value,
      title: title ?? entry.value.title,
      description: description ?? entry.value.description,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ series: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const key = seriesKey(user.id, ctx.params.id);
    const entry = await kv.get<Series>(key);
    if (!entry.value) return notFound("Series not found");

    // MVP safety: don’t cascade delete yet.
    const anyBooks = await kv
      .list(
        { prefix: ["yawt", "bookOrder", user.id, ctx.params.id] },
        { limit: 1 },
      )
      .next();
    if (!anyBooks.done) {
      return json(
        { error: "Series is not empty. Delete books first." },
        { status: 409 },
      );
    }

    await kv.delete(key);
    return json({ message: "Series deleted" }, { status: 200 });
  },
};
