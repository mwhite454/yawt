/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "../../components/Layout.tsx";
import { kv } from "../../utils/kv.ts";
import { getUser, type User } from "../../utils/session.ts";
import type { Series } from "../../utils/story/types.ts";
import { seriesKey } from "../../utils/story/keys.ts";

interface Data {
  user: User;
  series: Series[];
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const series: Series[] = [];
    for await (
      const entry of kv.list<Series>({
        prefix: ["yawt", "series", user.id],
      })
    ) {
      if (entry.value) series.push(entry.value);
    }

    series.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    return ctx.render({ user, series });
  },

  async POST(req) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const form = await req.formData();
    const title = String(form.get("title") ?? "").trim();
    const descriptionRaw = String(form.get("description") ?? "").trim();
    const description = descriptionRaw ? descriptionRaw : undefined;

    if (!title) {
      return Response.redirect(new URL("/series", req.url), 303);
    }

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

    const ok = await kv.atomic().set(seriesKey(user.id, id), record).commit();
    if (!ok.ok) return new Response("Failed to create series", { status: 500 });

    return Response.redirect(new URL(`/series/${id}`, req.url), 303);
  },
};

export default function SeriesIndex({ data }: PageProps<Data>) {
  return (
    <Layout user={data.user} title="YAWT">
      <div class="grid gap-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Your Series</h1>
            <p class="opacity-80">
              Create a series, then add books, scenes, characters, and
              timelines.
            </p>

            <form method="POST" class="grid gap-3 mt-2">
              <input
                class="input input-bordered"
                name="title"
                placeholder="New series title"
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          {data.series.length === 0
            ? (
              <div class="alert">
                <span>No series yet. Create one above.</span>
              </div>
            )
            : (
              data.series.map((s) => (
                <a
                  key={s.id}
                  class="card bg-base-100 shadow-sm hover:shadow transition"
                  href={`/series/${s.id}`}
                >
                  <div class="card-body">
                    <h2 class="card-title">{s.title}</h2>
                    {s.description && (
                      <p class="opacity-80">{s.description.slice(0, 180)}</p>
                    )}
                    <div class="card-actions justify-end">
                      <span class="btn btn-sm btn-ghost">Open</span>
                    </div>
                  </div>
                </a>
              ))
            )}
        </div>
      </div>
    </Layout>
  );
}
