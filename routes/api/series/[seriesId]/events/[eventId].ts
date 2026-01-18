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
import { toStringArray } from "@utils/story/convert.ts";

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

    // Normalize optional string fields: treat empty strings as undefined
    let description = entry.value.description;
    if (typeof body.description === "string") {
      const trimmed = body.description.trim();
      description = trimmed === "" ? undefined : trimmed;
    }

    let startDate = entry.value.startDate;
    if (typeof body.startDate === "string") {
      const trimmed = body.startDate.trim();
      startDate = trimmed === "" ? undefined : trimmed;
    }

    let endDate = entry.value.endDate;
    if (typeof body.endDate === "string") {
      const trimmed = body.endDate.trim();
      endDate = trimmed === "" ? undefined : trimmed;
    }

    let locationId = entry.value.locationId;
    if (typeof body.locationId === "string") {
      const trimmed = body.locationId.trim();
      locationId = trimmed === "" ? undefined : trimmed;
    }

    const updated: Event = {
      ...entry.value,
      title: title ?? entry.value.title,
      description,
      startDate,
      endDate,
      locationId,
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
    return json({ message: "Event deleted" }, { status: 200 });
  },
};
