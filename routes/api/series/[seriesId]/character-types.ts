import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser } from "@utils/http.ts";
import type { CharacterType } from "@utils/story/types.ts";
import { characterTypeKey, seriesKey } from "@utils/story/keys.ts";

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

    const characterTypes: CharacterType[] = [];
    const entries = kv.list<CharacterType>({
      prefix: ["yawt", "characterType", user.id, seriesId],
    });
    for await (const entry of entries) {
      characterTypes.push(entry.value);
    }
    return json({ characterTypes }, { status: 200 });
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

    const fields = Array.isArray(body.fields)
      ? (body.fields as CharacterType["fields"])
      : [];

    const now = Date.now();
    const id = crypto.randomUUID();
    const characterType: CharacterType = {
      id,
      userId: user.id,
      seriesId,
      name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : undefined,
      fields,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(characterTypeKey(user.id, seriesId, id), characterType);
    return json({ characterType }, { status: 201 });
  },
};
