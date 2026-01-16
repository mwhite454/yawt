/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "../../../../components/Layout.tsx";
import { kv } from "../../../../utils/kv.ts";
import { getUser, type User } from "../../../../utils/session.ts";
import type {
  Book,
  Scene,
  Series,
  Timeline,
} from "../../../../utils/story/types.ts";
import {
  bookKey,
  seriesKey,
  timelineKey,
} from "../../../../utils/story/keys.ts";
import { sceneKey } from "../../../../utils/story/keys.ts";

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
  // Fall back to stable ordering for non-parseable strings.
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

interface Data {
  user: User;
  series: Series;
  timeline: Timeline;
  events: SceneEvent[];
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const { seriesId, timelineId } = ctx.params;

    const [seriesRes, timelineRes] = await Promise.all([
      kv.get<Series>(seriesKey(user.id, seriesId)),
      kv.get<Timeline>(timelineKey(user.id, seriesId, timelineId)),
    ]);

    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }
    if (!timelineRes.value) {
      return new Response("Timeline not found", { status: 404 });
    }

    const events = await listTimelineSceneEvents(user.id, seriesId, timelineId);

    return ctx.render({
      user,
      series: seriesRes.value,
      timeline: timelineRes.value,
      events,
    });
  },
};

export default function TimelineDetail({ data }: PageProps<Data>) {
  return (
    <Layout user={data.user} title={data.series.title}>
      <div class="breadcrumbs text-sm">
        <ul>
          <li>
            <a href="/series">Series</a>
          </li>
          <li>
            <a href={`/series/${data.series.id}`}>{data.series.title}</a>
          </li>
          <li>
            <a href={`/series/${data.series.id}/timelines`}>Timelines</a>
          </li>
          <li>{data.timeline.title}</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">{data.timeline.title}</h1>
            {data.timeline.description && (
              <p class="opacity-80 whitespace-pre-wrap">
                {data.timeline.description}
              </p>
            )}
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Events</h2>

            <div class="alert alert-info mt-2">
              <span>
                Events come from Scenes. Add{" "}
                <span class="font-mono">startDate</span>/{" "}
                <span class="font-mono">endDate</span>{" "}
                in scene YAML frontmatter. To scope a scene to this timeline,
                include{" "}
                <span class="font-mono">timelines: ["{data.timeline.id}"]</span>
                .
              </span>
            </div>

            <div class="divider" />

            {data.events.length === 0
              ? (
                <div class="alert">
                  <span>No events yet.</span>
                </div>
              )
              : (
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Book</th>
                        <th>Start</th>
                        <th>End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.events.map((e) => (
                        <tr key={e.sceneId}>
                          <td>
                            <a
                              class="link link-hover"
                              href={`/series/${data.series.id}/books/${e.bookId}?scene=${e.sceneId}`}
                            >
                              {e.title}
                            </a>
                          </td>
                          <td>{e.bookTitle ?? ""}</td>
                          <td>{e.startDate ?? ""}</td>
                          <td>{e.endDate ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
