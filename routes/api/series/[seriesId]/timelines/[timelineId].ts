import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Timeline } from "@utils/story/types.ts";
import { timelineKey } from "@utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, timelineId } = ctx.params;

    const entry = await kv.get<Timeline>(
      timelineKey(user.id, seriesId, timelineId),
    );
    if (!entry.value) return notFound("Timeline not found");
    return json({ timeline: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, timelineId } = ctx.params;

    const key = timelineKey(user.id, seriesId, timelineId);
    const entry = await kv.get<Timeline>(key);
    if (!entry.value) return notFound("Timeline not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    if (title !== undefined && !title) {
      return badRequest("title cannot be empty");
    }

    const updated: Timeline = {
      ...entry.value,
      title: title ?? entry.value.title,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ timeline: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, timelineId } = ctx.params;

    const key = timelineKey(user.id, seriesId, timelineId);
    const entry = await kv.get<Timeline>(key);
    if (!entry.value) return notFound("Timeline not found");

    await kv.delete(key);
    return json({ message: "Timeline deleted" }, { status: 200 });
  },
};
