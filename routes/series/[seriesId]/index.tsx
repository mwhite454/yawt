/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { Book, Series } from "@utils/story/types.ts";
import { bookKey, bookOrderKey, seriesKey } from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";
import { getAllSeriesForUser } from "@utils/story/series.ts";
import ImageUploader from "@islands/ImageUploader.tsx";
import { BookCover } from "@components/BookCover.tsx";
import { buildR2ObjectUrl } from "@utils/r2.ts";

interface Data {
  user: User;
  series: Series;
  allSeries: Series[];
  books: Book[];
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const seriesId = ctx.params.seriesId;
    const [seriesRes, allSeries] = await Promise.all([
      kv.get<Series>(seriesKey(user.id, seriesId)),
      getAllSeriesForUser(user.id),
    ]);
    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }

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
      for (const res of results) {
        if (res.value) {
          const book = res.value;
          // Populate the cover image URL if available
          if (book.coverImage?.objectKey) {
            // Try public R2 URL first, fall back to image proxy endpoint
            book.coverImage.url = buildR2ObjectUrl(book.coverImage.objectKey) ??
              `/api/image?key=${encodeURIComponent(book.coverImage.objectKey)}`;
          }
          books.push(book);
        }
      }
    }

    return ctx.render({ user, series: seriesRes.value, allSeries, books });
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
      hasChapters: true,
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
  const { series, allSeries } = data;

  return (
    <Layout
      user={data.user}
      title={series.title}
      series={allSeries}
      currentSeriesId={series.id}
      currentPage="books"
    >
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

                <div class="divider my-2" />

                <ImageUploader
                  uploadPath={`/api/series/${series.id}/image/upload`}
                  updatePath={`/api/series/${series.id}`}
                  fieldName="icon"
                  existingObjectKey={series.icon?.objectKey}
                  existingContentType={series.icon?.contentType}
                  label="Series Icon"
                />
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
                <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {data.books.map((b) => (
                    <div key={b.id}>
                      <BookCover
                        title={b.title}
                        authorName={data.user.name ?? "Unknown"}
                        coverImage={b.coverImage}
                        href={`/series/${series.id}/books/${b.id}/settings`}
                      />
                      <a
                        class="btn btn-sm btn-block mt-2"
                        href={`/series/${series.id}/books/${b.id}`}
                      >
                        Open scenes
                      </a>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
