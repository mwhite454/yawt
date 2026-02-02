import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Character, CharacterType } from "@utils/story/types.ts";
import { characterTypeKey } from "@utils/story/keys.ts";
import { validateFieldDefinitions } from "@utils/story/validation.ts";

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

    let fields = entry.value.fields;
    if (body.fields !== undefined) {
      const fieldsValidation = validateFieldDefinitions(body.fields);
      if (typeof fieldsValidation === "string") {
        return badRequest(fieldsValidation);
      }
      fields = fieldsValidation;
    }

    const updated: CharacterType = {
      ...entry.value,
      name: name ?? entry.value.name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      fields,
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

    // Check if any characters are using this type
    const charactersUsingType: string[] = [];
    const entries = kv.list<Character>({
      prefix: ["yawt", "character", user.id, seriesId],
    });
    for await (const charEntry of entries) {
      if (charEntry.value?.characterTypeId === typeId) {
        charactersUsingType.push(charEntry.value.name);
      }
    }

    if (charactersUsingType.length > 0) {
      return badRequest(
        `Cannot delete character type: ${
          charactersUsingType.length
        } character(s) are using it (${charactersUsingType.slice(0, 3).join(", ")}${
          charactersUsingType.length > 3 ? ", ..." : ""
        })`,
      );
    }

    await kv.delete(key);
    return json({ success: true }, { status: 200 });
  },
};
