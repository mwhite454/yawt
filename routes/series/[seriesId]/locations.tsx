/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "../../../components/Layout.tsx";
import { kv } from "../../../utils/kv.ts";
import { getUser, type User } from "../../../utils/session.ts";
import type { Location, Series } from "../../../utils/story/types.ts";
import { locationKey, seriesKey } from "../../../utils/story/keys.ts";

interface Data {
  user: User;
  series: Series;
  locations: Location[];
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

    const locations: Location[] = [];
    for await (
      const entry of kv.list<Location>({
        prefix: ["yawt", "location", user.id, seriesId],
      })
    ) {
      if (entry.value) locations.push(entry.value);
    }

    locations.sort((a, b) => a.name.localeCompare(b.name));

    return ctx.render({ user, series: seriesRes.value, locations });
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
    const name = String(form.get("name") ?? "").trim();
    const descriptionRaw = String(form.get("description") ?? "").trim();
    const description = descriptionRaw ? descriptionRaw : undefined;

    if (!name) {
      return Response.redirect(
        new URL(`/series/${seriesId}/locations`, req.url),
        303,
      );
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    const location: Location = {
      id,
      userId: user.id,
      seriesId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(locationKey(user.id, seriesId, id), location)
      .commit();

    if (!ok.ok) {
      return new Response("Failed to create location", { status: 500 });
    }

    return Response.redirect(
      new URL(`/series/${seriesId}/locations`, req.url),
      303,
    );
  },
};

export default function LocationsPage({ data }: PageProps<Data>) {
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
          <li>Locations</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Locations</h1>

            <form method="POST" class="grid gap-3">
              <input
                class="input input-bordered"
                name="name"
                placeholder="Location name"
                required
              />
              <textarea
                class="textarea textarea-bordered"
                name="description"
                placeholder="Description (optional)"
                rows={3}
              />
              <div class="card-actions justify-end">
                <button class="btn btn-primary" type="submit">
                  Add location
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          {data.locations.map((l) => (
            <div key={l.id} class="card bg-base-100 shadow-sm">
              <div class="card-body">
                <div class="font-semibold">{l.name}</div>
                {l.description && (
                  <div class="text-sm opacity-80 whitespace-pre-wrap">
                    {l.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.locations.length === 0 && (
          <div class="alert">
            <span>No locations yet.</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
