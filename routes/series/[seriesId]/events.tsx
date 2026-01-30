/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type {
  Character,
  Event,
  Location,
  Scene,
  Series,
} from "@utils/story/types.ts";
import {
  bookKey,
  eventKey,
  sceneKey,
  seriesKey,
} from "@utils/story/keys.ts";
import { toStringArray } from "@utils/story/convert.ts";
import EventForm from "@islands/EventForm.tsx";

interface Data {
  user: User;
  series: Series;
  events: Event[];
  characters: Character[];
  locations: Location[];
  scenes: Array<Scene & { bookTitle?: string }>;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const seriesId = ctx.params.seriesId;
    const seriesRes = await kv.get<Series>(seriesKey(user.id, seriesId));
    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }

    // Fetch events
    const events: Event[] = [];
    for await (
      const entry of kv.list<Event>({
        prefix: ["yawt", "event", user.id, seriesId],
      })
    ) {
      if (entry.value) events.push(entry.value);
    }
    events.sort((a, b) => b.updatedAt - a.updatedAt);

    // Fetch characters for dropdown
    const characters: Character[] = [];
    for await (
      const entry of kv.list<Character>({
        prefix: ["yawt", "character", user.id, seriesId],
      })
    ) {
      if (entry.value) characters.push(entry.value);
    }
    characters.sort((a, b) => a.name.localeCompare(b.name));

    // Fetch locations for dropdown
    const locations: Location[] = [];
    for await (
      const entry of kv.list<Location>({
        prefix: ["yawt", "location", user.id, seriesId],
      })
    ) {
      if (entry.value) locations.push(entry.value);
    }
    locations.sort((a, b) => a.name.localeCompare(b.name));

    // Fetch all scenes from all books
    const bookOrderEntries = kv.list({
      prefix: ["yawt", "bookOrder", user.id, seriesId],
    });

    const bookIds: string[] = [];
    for await (const entry of bookOrderEntries) {
      const key = entry.key as unknown[];
      const bookId = key[key.length - 1];
      if (typeof bookId === "string") bookIds.push(bookId);
    }

    // Get book titles
    const bookTitles = new Map<string, string>();
    if (bookIds.length) {
      const bookKeys = bookIds.map((id) => bookKey(user.id, seriesId, id));
      const bookResults = await kv.getMany(bookKeys);
      for (const res of bookResults) {
        if (res.value) {
          const book = res.value as { id: string; title: string };
          bookTitles.set(book.id, book.title);
        }
      }
    }

    // Fetch all scenes
    const scenes: Array<Scene & { bookTitle?: string }> = [];
    for (const bookId of bookIds) {
      const sceneOrderEntries = kv.list({
        prefix: ["yawt", "sceneOrder", user.id, seriesId, bookId],
      });

      const sceneIds: string[] = [];
      for await (const entry of sceneOrderEntries) {
        const key = entry.key as unknown[];
        const sceneId = key[key.length - 1];
        if (typeof sceneId === "string") sceneIds.push(sceneId);
      }

      if (!sceneIds.length) continue;

      const sceneKeys = sceneIds.map((id) =>
        sceneKey(user.id, seriesId, bookId, id)
      );
      const sceneResults = await kv.getMany(sceneKeys);
      for (const res of sceneResults) {
        if (res.value) {
          const scene = res.value as Scene;
          scenes.push({
            ...scene,
            bookTitle: bookTitles.get(bookId),
          });
        }
      }
    }

    return ctx.render({
      user,
      series: seriesRes.value,
      events,
      characters,
      locations,
      scenes,
    });
  },

  async POST(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const seriesId = ctx.params.seriesId;
    const seriesRes = await kv.get<Series>(seriesKey(user.id, seriesId));
    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }

    const form = await req.formData();
    const title = String(form.get("title") ?? "").trim();
    const descriptionRaw = String(form.get("description") ?? "").trim();
    const description = descriptionRaw ? descriptionRaw : undefined;
    const startDateRaw = String(form.get("startDate") ?? "").trim();
    const startDate = startDateRaw ? startDateRaw : undefined;
    const endDateRaw = String(form.get("endDate") ?? "").trim();
    const endDate = endDateRaw ? endDateRaw : undefined;
    const locationIdRaw = String(form.get("locationId") ?? "").trim();
    const locationId = locationIdRaw ? locationIdRaw : undefined;

    // Handle multi-select for characters
    const characterIds = toStringArray(form.getAll("characterIds"));

    // Handle multi-select for scenes
    const sceneIds = toStringArray(form.getAll("sceneIds"));

    // Handle tags - can be from island (array) or from plain form (comma-separated)
    const tags = toStringArray(form.getAll("tags"));

    if (!title) {
      return Response.redirect(
        new URL(`/series/${seriesId}/events`, req.url),
        303,
      );
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    const event: Event = {
      id,
      userId: user.id,
      seriesId,
      title,
      description,
      startDate,
      endDate,
      locationId,
      characterIds,
      sceneIds,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(eventKey(user.id, seriesId, id), event)
      .commit();

    if (!ok.ok) {
      console.error("Failed to create event in KV", {
        userId: user.id,
        seriesId,
        eventId: id,
        kvResult: ok,
      });
      return new Response(
        "Failed to create event. Please try again later.",
        { status: 500 },
      );
    }

    return Response.redirect(
      new URL(`/series/${seriesId}/events`, req.url),
      303,
    );
  },
};

export default function EventsPage({ data }: PageProps<Data>) {
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
          <li>Events</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Events</h1>

            <EventForm
              seriesId={data.series.id}
              characters={data.characters}
              locations={data.locations}
              scenes={data.scenes}
            />
          </div>
        </div>

        <div class="grid gap-3">
          {data.events.map((event) => (
            <div key={event.id} class="card bg-base-100 shadow-sm">
              <div class="card-body">
                <h3 class="card-title">{event.title}</h3>
                {event.description && (
                  <p class="opacity-80 whitespace-pre-wrap">
                    {event.description}
                  </p>
                )}

                <div class="grid md:grid-cols-2 gap-2 text-sm mt-2">
                  {event.startDate && (
                    <div>
                      <span class="font-semibold">Start:</span> {event.startDate}
                    </div>
                  )}
                  {event.endDate && (
                    <div>
                      <span class="font-semibold">End:</span> {event.endDate}
                    </div>
                  )}
                  {event.locationId && (
                    <div>
                      <span class="font-semibold">Location:</span>{" "}
                      {data.locations.find((l) => l.id === event.locationId)
                        ?.name || event.locationId}
                    </div>
                  )}
                </div>

                {event.characterIds && event.characterIds.length > 0 && (
                  <div class="mt-2">
                    <span class="font-semibold text-sm">Characters:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      {event.characterIds.map((charId) => {
                        const char = data.characters.find((c) => c.id === charId);
                        if (!char) {
                          // Orphaned character reference; skip rendering this ID
                          return null;
                        }
                        return (
                          <span key={charId} class="badge badge-primary badge-sm">
                            {char.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {event.sceneIds && event.sceneIds.length > 0 && (
                  <div class="mt-2">
                    <span class="font-semibold text-sm">Scenes:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      {event.sceneIds.map((sceneId) => {
                        const scene = data.scenes.find((s) => s.id === sceneId);
                        if (!scene) {
                          // Orphaned scene reference; skip rendering this ID
                          return null;
                        }
                        const sceneLabel = scene.derived?.title ||
                          `Scene ${sceneId.slice(0, 6)}`;
                        return (
                          <span key={sceneId} class="badge badge-secondary badge-sm">
                            {sceneLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {event.tags && event.tags.length > 0 && (
                  <div class="mt-2">
                    <span class="font-semibold text-sm">Plotlines:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      {event.tags.map((tag) => (
                        <span key={tag} class="badge badge-accent badge-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.events.length === 0 && (
          <div class="alert">
            <span>No events yet. Create one above.</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
