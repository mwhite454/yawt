import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser } from "@utils/http.ts";
import type { Timeline } from "@utils/story/types.ts";
import { seriesKey, timelineKey } from "@utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId } = ctx.params;

    const series = await kv.get(seriesKey(user.id, seriesId));
    if (!series.value) {
      return json({ error: "Series not found" }, { status: 404 });
    }

    const timelines: Timeline[] = [];
    const entries = kv.list<Timeline>({
      prefix: ["yawt", "timeline", user.id, seriesId],
    });
    for await (const entry of entries) {
      timelines.push(entry.value);
    }
    return json({ timelines }, { status: 200 });
  },

  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId } = ctx.params;

    const series = await kv.get(seriesKey(user.id, seriesId));
    if (!series.value) {
      return json({ error: "Series not found" }, { status: 404 });
    }

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return badRequest("title is required");

    const now = Date.now();
    const id = crypto.randomUUID();
    const timeline: Timeline = {
      id,
      userId: user.id,
      seriesId,
      title,
      description: typeof body.description === "string"
        ? body.description.trim()
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(timelineKey(user.id, seriesId, id), timeline);
    return json({ timeline }, { status: 201 });
  },
};
