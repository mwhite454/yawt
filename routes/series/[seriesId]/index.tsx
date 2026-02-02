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
    for await (
      const entry of kv.list({
        prefix: ["yawt", "bookOrder", user.id, seriesId],
      })
    ) {
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
    for await (
      const entry of kv.list(
        { prefix: ["yawt", "bookOrder", user.id, seriesId] },
        { reverse: true, limit: 1 },
      )
    ) {
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
      303,
    );
  },
};

export default function SeriesDetail({ data }: PageProps<Data>) {
  const { series } = data;

  // Context-aware sidebar content for the series page
  const sidebarContent = (
    <div class="grid gap-4">
      <div>
        <h3 class="font-semibold mb-2">Quick Navigation</h3>
        <ul class="menu bg-base-200 rounded-box">
          <li>
            <a href={`/series/${series.id}/characters`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Characters
            </a>
          </li>
          <li>
            <a href={`/series/${series.id}/locations`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Locations
            </a>
          </li>
          <li>
            <a href={`/series/${series.id}/timelines`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Timelines
            </a>
          </li>
          <li>
            <a href={`/series/${series.id}/events`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Events
            </a>
          </li>
        </ul>
      </div>

      <div class="divider" />

      <div>
        <h3 class="font-semibold mb-2">Series Info</h3>
        <div class="text-sm opacity-80">
          <p>
            <strong>Title:</strong> {series.title}
          </p>
          {series.description && (
            <p class="mt-2">
              <strong>Description:</strong> {series.description}
            </p>
          )}
          <p class="mt-2">
            <strong>Books:</strong> {data.books.length}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout
      user={data.user}
      title={series.title}
      sidebarContent={sidebarContent}
    >
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

            {data.books.length === 0
              ? (
                <div class="alert">
                  <span>No books yet. Add one above.</span>
                </div>
              )
              : (
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
