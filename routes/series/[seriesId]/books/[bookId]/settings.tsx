/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { Book, Scene, Series } from "@utils/story/types.ts";
import { bookKey, seriesKey } from "@utils/story/keys.ts";
import { getAllSeriesForUser } from "@utils/story/series.ts";
import BookCoverUploader from "@islands/BookCoverUploader.tsx";

interface Data {
  user: User;
  series: Series;
  allSeries: Series[];
  book: Book;
  sceneCount: number;
  chapterCount: number;
  lastUpdated: number;
  totalWords: number;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const { seriesId, bookId } = ctx.params;

    const [seriesRes, bookRes, allSeries] = await Promise.all([
      kv.get<Series>(seriesKey(user.id, seriesId)),
      kv.get<Book>(bookKey(user.id, seriesId, bookId)),
      getAllSeriesForUser(user.id),
    ]);

    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }
    if (!bookRes.value) return new Response("Book not found", { status: 404 });

    // Count chapters
    let chapterCount = 0;
    for await (
      const _entry of kv.list({
        prefix: ["yawt", "chapterOrder", user.id, seriesId, bookId],
      })
    ) {
      chapterCount++;
    }

    // Get all scenes and calculate stats
    const sceneIds: string[] = [];
    let lastUpdated = bookRes.value.updatedAt;
    for await (
      const entry of kv.list({
        prefix: ["yawt", "sceneOrder", user.id, seriesId, bookId],
      })
    ) {
      const key = entry.key as unknown[];
      const sceneId = key[key.length - 1];
      if (typeof sceneId === "string") sceneIds.push(sceneId);
    }

    const scenes: Scene[] = [];
    if (sceneIds.length) {
      const keys = sceneIds.map((id) => [
        "yawt",
        "scene",
        user.id,
        seriesId,
        bookId,
        id,
      ]);
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Scene>[];
      for (const res of results) {
        if (res.value) {
          scenes.push(res.value);
          if (res.value.updatedAt > lastUpdated) {
            lastUpdated = res.value.updatedAt;
          }
        }
      }
    }

    // Calculate rough word count across all scenes
    const totalWords = scenes.reduce((sum, scene) => {
      const words = scene.text.split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);

    return ctx.render({
      user,
      series: seriesRes.value,
      allSeries,
      book: bookRes.value,
      sceneCount: sceneIds.length,
      chapterCount,
      lastUpdated,
      totalWords,
    });
  },
};

export default function BookSettings({ data }: PageProps<Data>) {
  const { series, allSeries, book, sceneCount, chapterCount, lastUpdated, totalWords } = data;

  const lastUpdatedDate = new Date(lastUpdated).toLocaleDateString();

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
            <div class="flex items-center justify-between">
              <h1 class="card-title">{book.title} - Settings</h1>
              <a
                href={`/series/${series.id}`}
                class="btn btn-sm btn-ghost"
              >
                ← Back to Series
              </a>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-4">
          {/* Cover Image Section */}
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h2 class="card-title">Cover Image</h2>
              <div class="divider my-2" />
              
              <BookCoverUploader
                title={book.title}
                authorName={data.user.name}
                uploadPath={`/api/series/${series.id}/books/${book.id}/image/upload`}
                updatePath={`/api/series/${series.id}/books/${book.id}`}
                fieldName="coverImage"
                existingCoverImage={book.coverImage}
              />

              <div class="divider my-2" />

              {/* Placeholder for previous images */}
              <div class="alert alert-info">
                <div>
                  <div class="font-semibold">Previous Images</div>
                  <div class="text-sm">
                    Feature coming soon: View and swap between previously uploaded cover images
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Statistics */}
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <h2 class="card-title">Statistics</h2>
              <div class="divider my-2" />
              
              <div class="stats stats-vertical shadow">
                <div class="stat">
                  <div class="stat-title">Total Scenes</div>
                  <div class="stat-value text-primary">{sceneCount}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title">Total Chapters</div>
                  <div class="stat-value text-secondary">{chapterCount}</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title">Rough Word Count</div>
                  <div class="stat-value text-accent">{totalWords.toLocaleString()}</div>
                  <div class="stat-desc">Across all scenes</div>
                </div>
                
                <div class="stat">
                  <div class="stat-title">Last Updated</div>
                  <div class="stat-value text-sm">{lastUpdatedDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Management Section */}
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Chapter Management</h2>
            <div class="divider my-2" />
            <div class="alert alert-info">
              <div>
                <div class="font-semibold">Chapter Management</div>
                <div class="text-sm">
                  Feature coming soon: Add, reorder, and organize chapters from this page
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scene Organization Section */}
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Scene Organization</h2>
            <div class="divider my-2" />
            <div class="alert alert-info">
              <div>
                <div class="font-semibold">Scene Organization</div>
                <div class="text-sm">
                  Feature coming soon: Organize and reorder scenes from this page
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="divider my-2" />
            <div class="flex gap-2 flex-wrap">
              <a
                href={`/series/${series.id}/books/${book.id}`}
                class="btn btn-primary"
              >
                Open Scenes
              </a>
              <a
                href={`/series/${series.id}`}
                class="btn btn-ghost"
              >
                Back to Series
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
