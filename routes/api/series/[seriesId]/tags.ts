import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { json, requireUser } from "@utils/http.ts";
import type { Scene } from "@utils/story/types.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId } = ctx.params;

    // Collect all unique tags from scenes in this series
    const tagsSet = new Set<string>();

    // List all scenes for this series
    const scenePrefix = ["yawt", "scene", user.id, seriesId];
    for await (const entry of kv.list<Scene>({ prefix: scenePrefix })) {
      if (entry.value?.derived?.tags) {
        for (const tag of entry.value.derived.tags) {
          tagsSet.add(tag);
        }
      }
    }

    const tags = Array.from(tagsSet).sort();
    return json({ tags }, { status: 200 });
  },
};
