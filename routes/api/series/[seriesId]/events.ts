import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser } from "@utils/http.ts";
import type { Event } from "@utils/story/types.ts";
import { eventKey, seriesKey } from "@utils/story/keys.ts";
import { toStringArray } from "@utils/story/convert.ts";

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

    const events: Event[] = [];
    const entries = kv.list<Event>({
      prefix: ["yawt", "event", user.id, seriesId],
    });
    for await (const entry of entries) {
      events.push(entry.value);
    }
    return json({ events }, { status: 200 });
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
    const event: Event = {
      id,
      userId: user.id,
      seriesId,
      title,
      description: typeof body.description === "string"
        ? body.description.trim()
        : undefined,
      startDate: typeof body.startDate === "string"
        ? body.startDate.trim()
        : undefined,
      endDate: typeof body.endDate === "string"
        ? body.endDate.trim()
        : undefined,
      locationId: typeof body.locationId === "string"
        ? body.locationId.trim()
        : undefined,
      characterIds: toStringArray(body.characterIds),
      sceneIds: toStringArray(body.sceneIds),
      tags: toStringArray(body.tags),
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(eventKey(user.id, seriesId, id), event);
    return json({ event }, { status: 201 });
  },
};
