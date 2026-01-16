import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Character } from "@utils/story/types.ts";
import { characterKey } from "@utils/story/keys.ts";
import { deleteObject, getR2Bucket } from "@utils/r2.ts";

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

    const expectedImagePrefix =
      `yawt/user/${user.id}/series/${seriesId}/characters/${characterId}/`;

    const prevObjectKey = entry.value.image?.objectKey;

    let nextImage: Character["image"] | undefined = entry.value.image;
    if (Object.prototype.hasOwnProperty.call(body, "image")) {
      const raw = (body as { image?: unknown }).image;
      if (raw === null) {
        nextImage = undefined;
      } else if (raw === undefined) {
        // no-op
      } else if (typeof raw === "object" && raw && !Array.isArray(raw)) {
        const img = raw as Record<string, unknown>;

        const objectKey = typeof img.objectKey === "string"
          ? img.objectKey.trim()
          : "";
        if (!objectKey) return badRequest("image.objectKey is required");
        if (!objectKey.startsWith(expectedImagePrefix)) {
          return badRequest(
            `image.objectKey must start with ${expectedImagePrefix}`,
          );
        }

        const contentType = typeof img.contentType === "string"
          ? img.contentType.trim()
          : undefined;
        const url = typeof img.url === "string" ? img.url.trim() : undefined;

        nextImage = {
          objectKey,
          ...(contentType ? { contentType } : {}),
          ...(url ? { url } : {}),
        };
      } else {
        return badRequest("image must be an object or null");
      }
    }

    const updated: Character = {
      ...entry.value,
      name: name ?? entry.value.name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      image: nextImage,
      extra: body.extra &&
          typeof body.extra === "object" &&
          !Array.isArray(body.extra)
        ? (body.extra as Record<string, unknown>)
        : entry.value.extra,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);

    const nextObjectKey = updated.image?.objectKey;
    if (prevObjectKey && prevObjectKey !== nextObjectKey) {
      const bucket = getR2Bucket();
      if (!bucket) {
        console.warn(
          "R2 bucket env var missing; skipping old image deletion",
          prevObjectKey,
        );
      } else {
        try {
          await deleteObject({ bucket, key: prevObjectKey });
        } catch (err) {
          console.warn(
            "Failed to delete previous character image from R2",
            prevObjectKey,
            String(err),
          );
        }
      }
    }

    return json({ character: updated }, { status: 200 });
  },
};
