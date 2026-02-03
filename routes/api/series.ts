import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, readJson, requireUser, forbidden } from "@utils/http.ts";
import type { Series } from "@utils/story/types.ts";
import { seriesKey } from "@utils/story/keys.ts";
import { hasPermission } from "@utils/auth/permissions.ts";
import { FREE_TIER_LIMITS } from "@utils/auth/types.ts";

export const handler: Handlers = {
  async GET(req) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const series: Series[] = [];
    const entries = kv.list<Series>({ prefix: ["yawt", "series", user.id] });
    for await (const entry of entries) {
      series.push(entry.value);
    }

    return json({ series }, { status: 200 });
  },

  async POST(req) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    // Check free tier series limit
    if (!hasPermission(user, "create:unlimited_series")) {
      let seriesCount = 0;
      for await (
        const _entry of kv.list<Series>({
          prefix: ["yawt", "series", user.id],
        })
      ) {
        seriesCount++;
        if (seriesCount >= FREE_TIER_LIMITS.maxSeries) {
          return forbidden("Series limit reached. Upgrade to create more series.");
        }
      }
    }

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string"
      ? body.description.trim()
      : undefined;

    if (!title) return badRequest("Title is required");

    const now = Date.now();
    const id = crypto.randomUUID();
    const record: Series = {
      id,
      userId: user.id,
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };

    await kv.set(seriesKey(user.id, id), record);
    return json({ series: record }, { status: 201 });
  },
};
