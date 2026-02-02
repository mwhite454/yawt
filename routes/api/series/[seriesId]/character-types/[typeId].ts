import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { CharacterType } from "@utils/story/types.ts";
import { characterTypeKey } from "@utils/story/keys.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, typeId } = ctx.params;

    const entry = await kv.get<CharacterType>(
      characterTypeKey(user.id, seriesId, typeId),
    );
    if (!entry.value) return notFound("Character type not found");
    return json({ characterType: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, typeId } = ctx.params;

    const key = characterTypeKey(user.id, seriesId, typeId);
    const entry = await kv.get<CharacterType>(key);
    if (!entry.value) return notFound("Character type not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    if (name !== undefined && !name) {
      return badRequest("name cannot be empty");
    }

    const updated: CharacterType = {
      ...entry.value,
      name: name ?? entry.value.name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      fields: Array.isArray(body.fields) ? body.fields : entry.value.fields,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
    return json({ characterType: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, typeId } = ctx.params;

    const key = characterTypeKey(user.id, seriesId, typeId);
    const entry = await kv.get<CharacterType>(key);
    if (!entry.value) return notFound("Character type not found");

    await kv.delete(key);
    return json({ success: true }, { status: 200 });
  },
};
