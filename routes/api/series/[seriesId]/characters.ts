import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser } from "@utils/http.ts";
import type { Character, CharacterType } from "@utils/story/types.ts";
import { characterKey, characterTypeKey, seriesKey } from "@utils/story/keys.ts";

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

    const characters: Character[] = [];
    const entries = kv.list<Character>({
      prefix: ["yawt", "character", user.id, seriesId],
    });
    for await (const entry of entries) {
      characters.push(entry.value);
    }
    return json({ characters }, { status: 200 });
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

    // Validate characterTypeId if provided
    const characterTypeId = typeof body.characterTypeId === "string"
      ? body.characterTypeId.trim()
      : undefined;

    if (characterTypeId) {
      const typeEntry = await kv.get<CharacterType>(
        characterTypeKey(user.id, seriesId, characterTypeId),
      );
      if (!typeEntry.value) {
        return badRequest(
          `Character type with id '${characterTypeId}' does not exist`,
        );
      }
    }

    const now = Date.now();
    const id = crypto.randomUUID();
    const character: Character = {
      id,
      userId: user.id,
      seriesId,
      name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : undefined,
      characterTypeId,
      typeData: body.typeData &&
          typeof body.typeData === "object" &&
          !Array.isArray(body.typeData)
        ? (body.typeData as Record<string, unknown>)
        : undefined,
      extra: body.extra &&
          typeof body.extra === "object" &&
          !Array.isArray(body.extra)
        ? (body.extra as Record<string, unknown>)
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(characterKey(user.id, seriesId, id), character);
    return json({ character }, { status: 201 });
  },
};
