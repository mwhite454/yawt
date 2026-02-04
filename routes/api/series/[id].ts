import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "@utils/http.ts";
import type { Series } from "@utils/story/types.ts";
import { seriesKey } from "@utils/story/keys.ts";
import { deleteObject, getR2Bucket } from "@utils/r2.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const entry = await kv.get<Series>(seriesKey(user.id, ctx.params.id));
    if (!entry.value) return notFound("Series not found");
    return json({ series: entry.value }, { status: 200 });
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const key = seriesKey(user.id, ctx.params.id);
    const entry = await kv.get<Series>(key);
    if (!entry.value) return notFound("Series not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string"
      ? body.title.trim()
      : undefined;
    const description = typeof body.description === "string"
      ? body.description.trim()
      : undefined;

    if (title !== undefined && !title) {
      return badRequest("Title cannot be empty");
    }

    const expectedImagePrefix =
      `yawt/user/${user.id}/series/${ctx.params.id}/icon/`;

    const prevObjectKey = entry.value.icon?.objectKey;

    let nextIcon: Series["icon"] | undefined = entry.value.icon;
    if (Object.prototype.hasOwnProperty.call(body, "icon")) {
      const raw = (body as { icon?: unknown }).icon;
      if (raw === null) {
        nextIcon = undefined;
      } else if (raw === undefined) {
        // no-op
      } else if (typeof raw === "object" && raw && !Array.isArray(raw)) {
        const img = raw as Record<string, unknown>;

        const objectKey = typeof img.objectKey === "string"
          ? img.objectKey.trim()
          : "";
        if (!objectKey) return badRequest("icon.objectKey is required");
        if (!objectKey.startsWith(expectedImagePrefix)) {
          return badRequest(
            `icon.objectKey must start with ${expectedImagePrefix}`,
          );
        }

        const contentType = typeof img.contentType === "string"
          ? img.contentType.trim()
          : undefined;
        const url = typeof img.url === "string" ? img.url.trim() : undefined;

        nextIcon = {
          objectKey,
          ...(contentType ? { contentType } : {}),
          ...(url ? { url } : {}),
        };
      } else {
        return badRequest("icon must be an object or null");
      }
    }

    const updated: Series = {
      ...entry.value,
      title: title ?? entry.value.title,
      description: description ?? entry.value.description,
      icon: nextIcon,
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);

    const nextObjectKey = updated.icon?.objectKey;
    if (prevObjectKey && prevObjectKey !== nextObjectKey) {
      // Validate the previous object key is within expected scope before deletion
      if (prevObjectKey.startsWith(expectedImagePrefix)) {
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
              "Failed to delete previous series icon from R2",
              prevObjectKey,
              String(err),
            );
          }
        }
      } else {
        console.warn(
          "Skipping deletion of previous series icon with unexpected path",
          { prevObjectKey, expectedImagePrefix },
        );
      }
    }

    return json({ series: updated }, { status: 200 });
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const key = seriesKey(user.id, ctx.params.id);
    const entry = await kv.get<Series>(key);
    if (!entry.value) return notFound("Series not found");

    // MVP safety: don’t cascade delete yet.
    const anyBooks = await kv
      .list(
        { prefix: ["yawt", "bookOrder", user.id, ctx.params.id] },
        { limit: 1 },
      )
      .next();
    if (!anyBooks.done) {
      return json(
        { error: "Series is not empty. Delete books first." },
        { status: 409 },
      );
    }

    await kv.delete(key);
    return json({ message: "Series deleted" }, { status: 200 });
  },
};
