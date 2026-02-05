/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { Book, Chapter, Scene, Series } from "@utils/story/types.ts";
import {
  bookKey,
  chapterKey,
  chapterOrderKey,
  sceneKey,
  sceneOrderKey,
  seriesKey,
} from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";
import { getAllSeriesForUser } from "@utils/story/series.ts";
import {
  deriveSceneFields,
  updateFrontmatterTags,
} from "@utils/story/frontmatter.ts";
import SceneList from "@islands/SceneList.tsx";
import TagInput from "@islands/TagInput.tsx";

interface Data {
  user: User;
  series: Series;
  allSeries: Series[];
  book: Book;
  chapters: Chapter[];
  scenes: Scene[];
  selectedScene: Scene | null;
  selectedSceneId: string | null;
  selectedChapterId: string | null;
}

function defaultSceneText(title: string) {
  return `---\ntitle: ${title}\n---\n\n`;
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

    // Get chapters
    const chapterIds: string[] = [];
    for await (
      const entry of kv.list({
        prefix: ["yawt", "chapterOrder", user.id, seriesId, bookId],
      })
    ) {
      const key = entry.key as unknown[];
      const chapterId = key[key.length - 1];
      if (typeof chapterId === "string") chapterIds.push(chapterId);
    }

    const chapters: Chapter[] = [];
    if (chapterIds.length) {
      const keys = chapterIds.map((id) =>
        chapterKey(user.id, seriesId, bookId, id)
      );
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Chapter>[];
      for (const res of results) if (res.value) chapters.push(res.value);
    }

    // Get all scenes (both in chapters and at book level)
    const sceneIds: string[] = [];
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
      const keys = sceneIds.map((id) =>
        sceneKey(user.id, seriesId, bookId, id)
      );
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Scene>[];
      for (const res of results) if (res.value) scenes.push(res.value);
    }

    const url = new URL(req.url);
    const selectedChapterId = url.searchParams.get("chapter") ?? null;
    const selectedSceneId = url.searchParams.get("scene") ?? scenes[0]?.id ??
      null;
    const selectedScene = selectedSceneId
      ? (scenes.find((s) => s.id === selectedSceneId) ?? null)
      : null;

    return ctx.render({
      user,
      series: seriesRes.value,
      allSeries,
      book: bookRes.value,
      chapters,
      scenes,
      selectedScene,
      selectedSceneId,
      selectedChapterId,
    });
  },

  async POST(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const { seriesId, bookId } = ctx.params;

    const form = await req.formData();
    const action = String(form.get("action") ?? "");

    const bookRes = await kv.get<Book>(bookKey(user.id, seriesId, bookId));
    if (!bookRes.value) return new Response("Book not found", { status: 404 });

    if (action === "createChapter") {
      const title = String(form.get("title") ?? "").trim() ||
        "Untitled chapter";

      let lastRank: string | undefined;
      for await (
        const entry of kv.list(
          { prefix: ["yawt", "chapterOrder", user.id, seriesId, bookId] },
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

      const chapter: Chapter = {
        id,
        userId: user.id,
        seriesId,
        bookId,
        rank,
        title,
        createdAt: now,
        updatedAt: now,
      };

      const ok = await kv
        .atomic()
        .set(chapterKey(user.id, seriesId, bookId, id), chapter)
        .set(chapterOrderKey(user.id, seriesId, bookId, rank, id), 1)
        .commit();

      if (!ok.ok) {
        return new Response("Failed to create chapter", { status: 500 });
      }

      return Response.redirect(
        new URL(
          `/series/${seriesId}/books/${bookId}?chapter=${id}`,
          req.url,
        ),
        303,
      );
    }

    if (action === "createScene") {
      const title = String(form.get("title") ?? "").trim() || "Untitled scene";
      const chapterId = String(form.get("chapterId") ?? "").trim() || undefined;

      let lastRank: string | undefined;
      const prefix = chapterId
        ? ["yawt", "sceneOrder", user.id, seriesId, bookId, chapterId]
        : ["yawt", "sceneOrder", user.id, seriesId, bookId];

      for await (
        const entry of kv.list(
          { prefix },
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
      const text = defaultSceneText(title);
      const derived = deriveSceneFields(text);

      const scene: Scene = {
        id,
        userId: user.id,
        seriesId,
        bookId,
        chapterId,
        rank,
        text,
        derived,
        createdAt: now,
        updatedAt: now,
      };

      const ok = await kv
        .atomic()
        .set(sceneKey(user.id, seriesId, bookId, id), scene)
        .set(sceneOrderKey(user.id, seriesId, bookId, rank, id, chapterId), 1)
        .commit();

      if (!ok.ok) {
        return new Response("Failed to create scene", { status: 500 });
      }

      const redirectUrl = chapterId
        ? `/series/${seriesId}/books/${bookId}?chapter=${chapterId}&scene=${id}`
        : `/series/${seriesId}/books/${bookId}?scene=${id}`;
      return Response.redirect(new URL(redirectUrl, req.url), 303);
    }

    if (action === "saveScene") {
      const sceneId = String(form.get("sceneId") ?? "").trim();
      let text = String(form.get("text") ?? "");

      if (!sceneId) {
        return Response.redirect(
          new URL(`/series/${seriesId}/books/${bookId}`, req.url),
          303,
        );
      }

      const sceneRes = await kv.get<Scene>(
        sceneKey(user.id, seriesId, bookId, sceneId),
      );
      if (!sceneRes.value) {
        return new Response("Scene not found", { status: 404 });
      }

      // Get tags from form
      const formTags = form.getAll("tags").map((t) => String(t)).filter((t) =>
        t.trim()
      );

      // Update frontmatter with tags if provided
      if (formTags.length > 0) {
        text = updateFrontmatterTags(text, formTags);
      }

      const now = Date.now();
      const updated: Scene = {
        ...sceneRes.value,
        text,
        derived: deriveSceneFields(text),
        updatedAt: now,
      };

      await kv.set(sceneKey(user.id, seriesId, bookId, sceneId), updated);

      return Response.redirect(
        new URL(
          `/series/${seriesId}/books/${bookId}?scene=${sceneId}`,
          req.url,
        ),
        303,
      );
    }

    return Response.redirect(
      new URL(`/series/${seriesId}/books/${bookId}`, req.url),
      303,
    );
  },
};

export default function BookDetail({ data }: PageProps<Data>) {
  const { series, allSeries, book, chapters, scenes, selectedScene, selectedChapterId } = data;

  // Organize scenes by chapter
  const scenesByChapter = new Map<string | null, Scene[]>();
  scenes.forEach((scene) => {
    const chId = scene.chapterId ?? null;
    if (!scenesByChapter.has(chId)) {
      scenesByChapter.set(chId, []);
    }
    scenesByChapter.get(chId)!.push(scene);
  });

  const bookLevelScenes = scenesByChapter.get(null) ?? [];

  return (
    <Layout
      user={data.user}
      title={series.title}
      series={allSeries}
      currentSeriesId={series.id}
      currentPage="books"
    >
      <div class="grid lg:grid-cols-12 gap-4 mt-3">
        <div class="lg:col-span-4">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="flex items-center justify-between gap-2">
                <h2 class="card-title">Structure</h2>
                <details class="dropdown dropdown-end">
                  <summary class="btn btn-sm">New</summary>
                  <div class="dropdown-content z-10 card card-compact bg-base-100 shadow w-80">
                    <div class="card-body">
                      <form method="POST" class="grid gap-2">
                        <input
                          type="hidden"
                          name="action"
                          value="createChapter"
                        />
                        <input
                          class="input input-bordered input-sm"
                          name="title"
                          placeholder="Chapter title"
                          required
                        />
                        <button class="btn btn-primary btn-sm" type="submit">
                          Create Chapter
                        </button>
                      </form>
                      <div class="divider my-1">OR</div>
                      <form method="POST" class="grid gap-2">
                        <input
                          type="hidden"
                          name="action"
                          value="createScene"
                        />
                        <input
                          class="input input-bordered input-sm"
                          name="title"
                          placeholder="Scene title"
                          required
                        />
                        <button class="btn btn-secondary btn-sm" type="submit">
                          Create Scene (Book Level)
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              </div>

              <div class="divider my-2" />

              {chapters.length === 0 && bookLevelScenes.length === 0
                ? (
                  <div class="alert">
                    <span>No chapters or scenes yet. Create one.</span>
                  </div>
                )
                : (
                  <div class="space-y-3">
                    {/* Book-level scenes */}
                    {bookLevelScenes.length > 0 && (
                      <div>
                        <div class="font-semibold text-sm mb-2 opacity-70">
                          Book-level Scenes
                        </div>
                        <SceneList
                          seriesId={series.id}
                          bookId={book.id}
                          scenes={bookLevelScenes.map((s) => ({
                            id: s.id,
                            title: s.derived?.title ||
                              `Scene ${s.id.slice(0, 6)}`,
                            rank: s.rank,
                          }))}
                          selectedSceneId={selectedScene?.id ?? null}
                        />
                      </div>
                    )}

                    {/* Chapters and their scenes */}
                    {chapters.map((chapter) => {
                      const chapterScenes = scenesByChapter.get(chapter.id) ??
                        [];
                      const isSelected = selectedChapterId === chapter.id;
                      return (
                        <div key={chapter.id} class="collapse collapse-arrow border border-base-300">
                          <input
                            type="checkbox"
                            defaultChecked={isSelected || chapterScenes.some((s) => s.id === selectedScene?.id)}
                          />
                          <div class="collapse-title font-medium">
                            <div class="flex items-center justify-between">
                              <span>{chapter.title}</span>
                              <span class="badge badge-sm">{chapterScenes.length}</span>
                            </div>
                          </div>
                          <div class="collapse-content">
                            <div class="mt-2 space-y-2">
                              {/* Add scene to chapter button */}
                              <form method="POST">
                                <input
                                  type="hidden"
                                  name="action"
                                  value="createScene"
                                />
                                <input
                                  type="hidden"
                                  name="chapterId"
                                  value={chapter.id}
                                />
                                <div class="flex gap-2">
                                  <input
                                    class="input input-bordered input-xs flex-1"
                                    name="title"
                                    placeholder="New scene"
                                    required
                                  />
                                  <button class="btn btn-xs" type="submit">
                                    +
                                  </button>
                                </div>
                              </form>

                              {chapterScenes.length === 0
                                ? (
                                  <div class="text-sm opacity-50">
                                    No scenes in this chapter
                                  </div>
                                )
                                : (
                                  <SceneList
                                    seriesId={series.id}
                                    bookId={book.id}
                                    scenes={chapterScenes.map((s) => ({
                                      id: s.id,
                                      title: s.derived?.title ||
                                        `Scene ${s.id.slice(0, 6)}`,
                                      rank: s.rank,
                                    }))}
                                    selectedSceneId={selectedScene?.id ?? null}
                                  />
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div class="lg:col-span-8">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="flex items-center justify-between gap-2">
                <h2 class="card-title">Editor</h2>
                {selectedScene && (
                  <div class="badge badge-outline">
                    {selectedScene.derived?.title ||
                      selectedScene.id.slice(0, 8)}
                  </div>
                )}
              </div>

              {!selectedScene
                ? (
                  <div class="alert">
                    <span>Select or create a scene to edit.</span>
                  </div>
                )
                : (
                  <form method="POST" class="grid gap-3">
                    <input type="hidden" name="action" value="saveScene" />
                    <input
                      type="hidden"
                      name="sceneId"
                      value={selectedScene.id}
                    />

                    <textarea
                      class="textarea textarea-bordered font-mono"
                      name="text"
                      rows={18}
                      value={selectedScene.text}
                    />

                    <TagInput
                      seriesId={series.id}
                      initialTags={selectedScene.derived?.tags ?? []}
                    />

                    <div class="card-actions justify-between">
                      <div class="text-sm opacity-70">
                        YAML frontmatter also supported in text editor.
                      </div>
                      <button class="btn btn-primary" type="submit">
                        Save
                      </button>
                    </div>
                  </form>
                )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
