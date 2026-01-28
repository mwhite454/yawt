/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { Book, Series } from "@utils/story/types.ts";
import { bookKey, bookOrderKey, seriesKey } from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";

interface Data {
  user: User;
  series: Series;
  books: Book[];
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const seriesId = ctx.params.seriesId;
    const series = await kv.get<Series>(seriesKey(user.id, seriesId));
    if (!series.value) return new Response("Series not found", { status: 404 });

    const bookIds: string[] = [];
    for await (const entry of kv.list({
      prefix: ["yawt", "bookOrder", user.id, seriesId],
    })) {
      const key = entry.key as unknown[];
      const bookId = key[key.length - 1];
      if (typeof bookId === "string") bookIds.push(bookId);
    }

    const books: Book[] = [];
    if (bookIds.length) {
      const keys = bookIds.map((id) => bookKey(user.id, seriesId, id));
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Book>[];
      for (const res of results) if (res.value) books.push(res.value);
    }

    return ctx.render({ user, series: series.value, books });
  },

  async POST(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const seriesId = ctx.params.seriesId;
    const series = await kv.get<Series>(seriesKey(user.id, seriesId));
    if (!series.value) return new Response("Series not found", { status: 404 });

    const form = await req.formData();
    const title = String(form.get("title") ?? "").trim();
    if (!title) {
      return Response.redirect(new URL(`/series/${seriesId}`, req.url), 303);
    }

    let lastRank: string | undefined;
    for await (const entry of kv.list(
      { prefix: ["yawt", "bookOrder", user.id, seriesId] },
      { reverse: true, limit: 1 }
    )) {
      const key = entry.key as unknown[];
      const maybeRank = key[key.length - 2];
      if (typeof maybeRank === "string") lastRank = maybeRank;
    }

    const rank = lastRank ? rankAfter(lastRank) : rankInitial();
    const now = Date.now();
    const id = crypto.randomUUID();
    const book: Book = {
      id,
      userId: user.id,
      seriesId,
      rank,
      title,
      createdAt: now,
      updatedAt: now,
    };

    const ok = await kv
      .atomic()
      .set(bookKey(user.id, seriesId, id), book)
      .set(bookOrderKey(user.id, seriesId, rank, id), 1)
      .commit();

    if (!ok.ok) return new Response("Failed to create book", { status: 500 });

    return Response.redirect(
      new URL(`/series/${seriesId}/books/${id}`, req.url),
      303
    );
  },
};

export default function SeriesDetail({ data }: PageProps<Data>) {
  const { series } = data;

  return (
    <Layout user={data.user} title={series.title}>
      <div class="breadcrumbs text-sm">
        <ul>
          <li>
            <a href="/series">Series</a>
          </li>
          <li>{series.title}</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 class="card-title">{series.title}</h1>
                {series.description && (
                  <p class="opacity-80 whitespace-pre-wrap">
                    {series.description}
                  </p>
                )}
              </div>
              <div class="join">
                <a
                  class="btn btn-sm join-item"
                  href={`/series/${series.id}/characters`}
                >
                  Characters
                </a>
                <a
                  class="btn btn-sm join-item"
                  href={`/series/${series.id}/locations`}
                >
                  Locations
                </a>
                <a
                  class="btn btn-sm join-item"
                  href={`/series/${series.id}/timelines`}
                >
                  Timelines
                </a>
                <a
                  class="btn btn-sm join-item"
                  href={`/series/${series.id}/events`}
                >
                  Events
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Books</h2>

            <form method="POST" class="flex flex-col sm:flex-row gap-2 mt-2">
              <input
                class="input input-bordered flex-1"
                name="title"
                placeholder="New book title"
                required
              />
              <button class="btn btn-primary" type="submit">
                Add book
              </button>
            </form>

            <div class="divider" />

            {data.books.length === 0 ? (
              <div class="alert">
                <span>No books yet. Add one above.</span>
              </div>
            ) : (
              <div class="grid md:grid-cols-2 gap-3">
                {data.books.map((b) => (
                  <a
                    key={b.id}
                    class="card bg-base-200 hover:shadow transition"
                    href={`/series/${series.id}/books/${b.id}`}
                  >
                    <div class="card-body p-4">
                      <div class="font-semibold">{b.title}</div>
                      <div class="text-sm opacity-70">Open scenes</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
