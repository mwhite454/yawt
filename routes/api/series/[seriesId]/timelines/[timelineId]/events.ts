import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, notFound, requireUser } from "@utils/http.ts";
import type { Book, Scene } from "@utils/story/types.ts";
import { bookKey, sceneKey, timelineKey } from "@utils/story/keys.ts";

type SceneEvent = {
  sceneId: string;
  bookId: string;
  bookTitle?: string;
  title: string;
  startDate?: string;
  endDate?: string;
};

function dateSortKey(value: string | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(value);
  if (Number.isFinite(ms)) return ms;
  return Number.POSITIVE_INFINITY - 1;
}

async function listTimelineSceneEvents(
  userId: number,
  seriesId: string,
  timelineId: string,
): Promise<SceneEvent[]> {
  const bookOrderEntries = kv.list({
    prefix: ["yawt", "bookOrder", userId, seriesId],
  });

  const bookIds: string[] = [];
  for await (const entry of bookOrderEntries) {
    const key = entry.key as unknown[];
    const bookId = key[key.length - 1];
    if (typeof bookId === "string") bookIds.push(bookId);
  }

  const booksById = new Map<string, Book>();
  if (bookIds.length) {
    const keys = bookIds.map((id) => bookKey(userId, seriesId, id));
    const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Book>[];
    for (const res of results) {
      if (res.value) booksById.set(res.value.id, res.value);
    }
  }

  const scenes: Scene[] = [];
  for (const bookId of bookIds) {
    const sceneOrderEntries = kv.list({
      prefix: ["yawt", "sceneOrder", userId, seriesId, bookId],
    });

    const sceneIds: string[] = [];
    for await (const entry of sceneOrderEntries) {
      const key = entry.key as unknown[];
      const sceneId = key[key.length - 1];
      if (typeof sceneId === "string") sceneIds.push(sceneId);
    }

    if (!sceneIds.length) continue;

    const keys = sceneIds.map((id) => sceneKey(userId, seriesId, bookId, id));
    const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Scene>[];
    for (const res of results) if (res.value) scenes.push(res.value);
  }

  const events: SceneEvent[] = scenes
    .filter((s) => {
      const hasDate = Boolean(s.derived?.startDate || s.derived?.endDate);
      if (!hasDate) return false;

      const timelineIds = s.derived?.timelineIds;
      if (!timelineIds || timelineIds.length === 0) return true;
      return timelineIds.includes(timelineId);
    })
    .map((s) => {
      const book = booksById.get(s.bookId);
      return {
        sceneId: s.id,
        bookId: s.bookId,
        bookTitle: book?.title,
        title: s.derived?.title || `Scene ${s.id.slice(0, 6)}`,
        startDate: s.derived?.startDate,
        endDate: s.derived?.endDate,
      };
    });

  events.sort((a, b) => {
    const aStart = dateSortKey(a.startDate);
    const bStart = dateSortKey(b.startDate);
    if (aStart !== bStart) return aStart - bStart;

    const aEnd = dateSortKey(a.endDate);
    const bEnd = dateSortKey(b.endDate);
    if (aEnd !== bEnd) return aEnd - bEnd;

    return a.title.localeCompare(b.title);
  });

  return events;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, timelineId } = ctx.params;

    const timeline = await kv.get(timelineKey(user.id, seriesId, timelineId));
    if (!timeline.value) return notFound("Timeline not found");

    const events = await listTimelineSceneEvents(user.id, seriesId, timelineId);
    return json({ events }, { status: 200 });
  },

  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, timelineId } = ctx.params;

    const timeline = await kv.get(timelineKey(user.id, seriesId, timelineId));
    if (!timeline.value) return notFound("Timeline not found");

    return badRequest(
      "Timeline events are derived from Scenes. Add startDate/endDate (and optional timelines: [<timelineId>]) in scene YAML frontmatter.",
    );
  },
};
