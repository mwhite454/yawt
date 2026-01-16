import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser } from "@utils/http.ts";
import type { Location } from "@utils/story/types.ts";
import { locationKey, seriesKey } from "@utils/story/keys.ts";

function toStringArray(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const out = value
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
    return out.length ? out : undefined;
  }
  if (typeof value === "string") {
    const s = value.trim();
    return s ? [s] : undefined;
  }
  return undefined;
}

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

    const locations: Location[] = [];
    const entries = kv.list<Location>({
      prefix: ["yawt", "location", user.id, seriesId],
    });
    for await (const entry of entries) {
      locations.push(entry.value);
    }

    return json({ locations }, { status: 200 });
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

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("name is required");

    const now = Date.now();
    const id = crypto.randomUUID();
    const location: Location = {
      id,
      userId: user.id,
      seriesId,
      name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : undefined,
      tags: toStringArray(body.tags),
      links: Array.isArray(body.links)
        ? (body.links as Location["links"])
        : undefined,
      coords: body.coords &&
          typeof body.coords === "object" &&
          !Array.isArray(body.coords)
        ? (body.coords as Location["coords"])
        : undefined,
      extra: body.extra &&
          typeof body.extra === "object" &&
          !Array.isArray(body.extra)
        ? (body.extra as Record<string, unknown>)
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(locationKey(user.id, seriesId, id), location);
    return json({ location }, { status: 201 });
  },
};
