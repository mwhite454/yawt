import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Event } from "@utils/story/types.ts";
import { eventKey } from "@utils/story/keys.ts";

function toStringArray(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const result = value
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
    return result.length ? result : undefined;
  }
  if (typeof value === "string") {
    const single = value.trim();
    return single ? [single] : undefined;
  }
  return undefined;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, eventId } = ctx.params;

    const entry = await kv.get<Event>(eventKey(user.id, seriesId, eventId));
    if (!entry.value) return notFound("Event not found");
    return json({ event: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, eventId } = ctx.params;

    const key = eventKey(user.id, seriesId, eventId);
    const entry = await kv.get<Event>(key);
    if (!entry.value) return notFound("Event not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    if (title !== undefined && !title) {
      return badRequest("title cannot be empty");
    }

    const updated: Event = {
      ...entry.value,
      title: title ?? entry.value.title,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      startDate: typeof body.startDate === "string"
        ? body.startDate.trim()
        : entry.value.startDate,
      endDate: typeof body.endDate === "string"
        ? body.endDate.trim()
        : entry.value.endDate,
      locationId: typeof body.locationId === "string"
        ? body.locationId.trim()
        : entry.value.locationId,
      characterIds: body.characterIds !== undefined
        ? toStringArray(body.characterIds)
        : entry.value.characterIds,
      sceneIds: body.sceneIds !== undefined
        ? toStringArray(body.sceneIds)
        : entry.value.sceneIds,
      tags: body.tags !== undefined
        ? toStringArray(body.tags)
        : entry.value.tags,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ event: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, eventId } = ctx.params;

    const key = eventKey(user.id, seriesId, eventId);
    const entry = await kv.get<Event>(key);
    if (!entry.value) return notFound("Event not found");

    await kv.delete(key);
    return json({ success: true }, { status: 200 });
  },
};
