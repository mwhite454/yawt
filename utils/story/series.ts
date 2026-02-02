/// <reference lib="deno.unstable" />

import { kv } from "@utils/kv.ts";
import type { Series } from "@utils/story/types.ts";

/**
 * Fetches all series for a given user, sorted by most recently updated first.
 */
export async function getAllSeriesForUser(userId: number): Promise<Series[]> {
  const series: Series[] = [];
  for await (const entry of kv.list<Series>({
    prefix: ["yawt", "series", userId],
  })) {
    if (entry.value) series.push(entry.value);
  }

  series.sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
  return series;
}
