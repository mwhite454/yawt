/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "../../../components/Layout.tsx";
import { kv } from "../../../utils/kv.ts";
import { getUser, type User } from "../../../utils/session.ts";
import type { Series, Timeline } from "../../../utils/story/types.ts";
import { seriesKey, timelineKey } from "../../../utils/story/keys.ts";

interface Data {
  user: User;
  series: Series;
  timelines: Timeline[];
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

    const timelines: Timeline[] = [];
    for await (
      const entry of kv.list<Timeline>({
        prefix: ["yawt", "timeline", user.id, seriesId],
      })
    ) {
      if (entry.value) timelines.push(entry.value);
    }

    timelines.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    return ctx.render({ user, series: seriesRes.value, timelines });
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

    if (!title) {
      return Response.redirect(
        new URL(`/series/${seriesId}/timelines`, req.url),
        303,
      );
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    const timeline: Timeline = {
      id,
      userId: user.id,
      seriesId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(timelineKey(user.id, seriesId, id), timeline)
      .commit();

    if (!ok.ok) {
      return new Response("Failed to create timeline", { status: 500 });
    }

    return Response.redirect(
      new URL(`/series/${seriesId}/timelines/${id}`, req.url),
      303,
    );
  },
};

export default function TimelinesPage({ data }: PageProps<Data>) {
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
          <li>Timelines</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Timelines</h1>

            <form method="POST" class="grid gap-3">
              <input
                class="input input-bordered"
                name="title"
                placeholder="Timeline title"
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
                  Add timeline
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          {data.timelines.map((t) => (
            <a
              key={t.id}
              class="card bg-base-100 shadow-sm hover:shadow transition"
              href={`/series/${data.series.id}/timelines/${t.id}`}
            >
              <div class="card-body">
                <div class="font-semibold">{t.title}</div>
                {t.description && (
                  <div class="text-sm opacity-80">{t.description}</div>
                )}
                <div class="card-actions justify-end">
                  <span class="btn btn-sm btn-ghost">Open</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {data.timelines.length === 0 && (
          <div class="alert">
            <span>No timelines yet.</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
