import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Location } from "@utils/story/types.ts";
import { locationKey } from "@utils/story/keys.ts";
import { deleteObject, getR2Bucket } from "@utils/r2.ts";

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
    const { seriesId, locationId } = ctx.params;

    const entry = await kv.get<Location>(
      locationKey(user.id, seriesId, locationId),
    );
    if (!entry.value) return notFound("Location not found");
    return json({ location: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, locationId } = ctx.params;

    const key = locationKey(user.id, seriesId, locationId);
    const entry = await kv.get<Location>(key);
    if (!entry.value) return notFound("Location not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    if (name !== undefined && !name) return badRequest("name cannot be empty");

    const expectedImagePrefix =
      `yawt/user/${user.id}/series/${seriesId}/locations/${locationId}/`;

    const prevObjectKey = entry.value.image?.objectKey;

    let nextImage: Location["image"] | undefined = entry.value.image;
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

    const updated: Location = {
      ...entry.value,
      name: name ?? entry.value.name,
      description: typeof body.description === "string"
        ? body.description.trim()
        : entry.value.description,
      image: nextImage,
      tags: body.tags !== undefined
        ? toStringArray(body.tags)
        : entry.value.tags,
      links: body.links !== undefined
        ? Array.isArray(body.links)
          ? (body.links as Location["links"])
          : undefined
        : entry.value.links,
      coords: body.coords !== undefined
        ? body.coords &&
            typeof body.coords === "object" &&
            !Array.isArray(body.coords)
          ? (body.coords as Location["coords"])
          : undefined
        : entry.value.coords,
      extra: body.extra !== undefined
        ? body.extra &&
            typeof body.extra === "object" &&
            !Array.isArray(body.extra)
          ? (body.extra as Record<string, unknown>)
          : undefined
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
            "Failed to delete previous location image from R2",
            prevObjectKey,
            String(err),
          );
        }
      }
    }

    return json({ location: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, locationId } = ctx.params;

    const key = locationKey(user.id, seriesId, locationId);
    const entry = await kv.get<Location>(key);
    if (!entry.value) return notFound("Location not found");

    // MVP: no referential integrity checks yet.
    await kv.delete(key);
    return json({ message: "Location deleted" }, { status: 200 });
  },
};
