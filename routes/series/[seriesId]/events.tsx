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
    const characterIds = form.getAll("characterIds").filter((v) =>
      typeof v === "string" && v.trim()
    ) as string[];

    // Handle multi-select for scenes
    const sceneIds = form.getAll("sceneIds").filter((v) =>
      typeof v === "string" && v.trim()
    ) as string[];

    // Handle tags - parse comma-separated string
    const tagsRaw = String(form.get("tags") ?? "").trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => t.trim()).filter((t) => t)
      : undefined;

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
      return new Response("Failed to create event", { status: 500 });
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

            <form method="POST" class="grid gap-3">
              <input
                class="input input-bordered"
                name="title"
                placeholder="Event title"
                required
              />
              <textarea
                class="textarea textarea-bordered"
                name="description"
                placeholder="Description (optional)"
                rows={3}
              />
              
              <div class="grid md:grid-cols-2 gap-3">
                <div>
                  <label class="label">
                    <span class="label-text">Start Date</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    name="startDate"
                    placeholder="YYYY-MM-DD or any date format"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">End Date</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    name="endDate"
                    placeholder="YYYY-MM-DD or any date format"
                  />
                </div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text">Location</span>
                </label>
                <select class="select select-bordered w-full" name="locationId">
                  <option value="">None</option>
                  {data.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label class="label">
                  <span class="label-text">Characters</span>
                </label>
                <select
                  class="select select-bordered w-full"
                  name="characterIds"
                  multiple
                  size={Math.min(5, Math.max(3, data.characters.length))}
                >
                  {data.characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
                <label class="label">
                  <span class="label-text-alt">
                    Hold Ctrl/Cmd to select multiple
                  </span>
                </label>
              </div>

              <div>
                <label class="label">
                  <span class="label-text">Scenes</span>
                </label>
                <select
                  class="select select-bordered w-full"
                  name="sceneIds"
                  multiple
                  size={Math.min(5, Math.max(3, data.scenes.length))}
                >
                  {data.scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {scene.derived?.title || `Scene ${scene.id.slice(0, 6)}`}
                      {scene.bookTitle && ` (${scene.bookTitle})`}
                    </option>
                  ))}
                </select>
                <label class="label">
                  <span class="label-text-alt">
                    Hold Ctrl/Cmd to select multiple
                  </span>
                </label>
              </div>

              <div>
                <label class="label">
                  <span class="label-text">Plotlines / Tags</span>
                </label>
                <input
                  class="input input-bordered w-full"
                  name="tags"
                  placeholder="Comma-separated tags (e.g., romance, battle, mystery)"
                />
                <label class="label">
                  <span class="label-text-alt">
                    Separate multiple tags with commas
                  </span>
                </label>
              </div>

              <div class="card-actions justify-end">
                <button class="btn btn-primary" type="submit">
                  Create Event
                </button>
              </div>
            </form>
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
                        return (
                          <span key={charId} class="badge badge-primary badge-sm">
                            {char?.name || charId.slice(0, 6)}
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
                        const sceneLabel = scene?.derived?.title ||
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
