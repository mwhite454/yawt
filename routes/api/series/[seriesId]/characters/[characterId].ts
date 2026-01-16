import { Handlers } from "$fresh/server.ts";
import { kv } from "../../../../../utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "../../../../../utils/http.ts";
import type { Character } from "../../../../../utils/story/types.ts";
import { characterKey } from "../../../../../utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, characterId } = ctx.params;

    const entry = await kv.get<Character>(
      characterKey(user.id, seriesId, characterId),
    );
    if (!entry.value) return notFound("Character not found");
    return json({ character: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, characterId } = ctx.params;

    const key = characterKey(user.id, seriesId, characterId);
    const entry = await kv.get<Character>(key);
    if (!entry.value) return notFound("Character not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    if (name !== undefined && !name) return badRequest("name cannot be empty");

    const updated: Character = {
      ...entry.value,
      name: name ?? entry.value.name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      image: body.image &&
          typeof body.image === "object" &&
          !Array.isArray(body.image)
        ? (body.image as Character["image"])
        : entry.value.image,
      extra: body.extra &&
          typeof body.extra === "object" &&
          !Array.isArray(body.extra)
        ? (body.extra as Record<string, unknown>)
        : entry.value.extra,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ character: updated }, { status: 200 });
  },
};
