/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type {
  Book,
  BookItem,
  Chapter,
  Scene,
  Series,
} from "@utils/story/types.ts";
import {
  bookItemOrderKey,
  bookKey,
  chapterKey,
  chapterSceneOrderKey,
  sceneKey,
  seriesKey,
} from "@utils/story/keys.ts";
import { rankAfter, rankInitial } from "@utils/story/rank.ts";
import { getAllSeriesForUser } from "@utils/story/series.ts";
import {
  deriveSceneFields,
  updateFrontmatterTags,
} from "@utils/story/frontmatter.ts";
import HierarchicalSceneList from "@islands/HierarchicalSceneList.tsx";
import TagInput from "@islands/TagInput.tsx";

interface Data {
  user: User;
  series: Series;
  allSeries: Series[];
  book: Book;
  chapters: Chapter[];
  scenes: Scene[];
  bookLevelScenes: Scene[];
  chapterScenes: Map<string, Scene[]>;
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

    // Get book items (chapters and book-level scenes) from unified order
    const bookItems: Array<{
      type: "chapter" | "scene";
      id: string;
      rank: string;
    }> = [];
    for await (
      const entry of kv.list<BookItem>({
        prefix: ["yawt", "bookItemOrder", user.id, seriesId, bookId],
      })
    ) {
      if (entry.value) {
        const key = entry.key as unknown[];
        const rank = key[key.length - 1] as string;
        bookItems.push({ ...entry.value, rank });
      }
    }

    // Separate chapters and book-level scene IDs
    const chapterIds = bookItems
      .filter((i) => i.type === "chapter")
      .map((i) => i.id);
    const bookLevelSceneIds = bookItems
      .filter((i) => i.type === "scene")
      .map((i) => i.id);

    // Fetch chapters
    const chapters: Chapter[] = [];
    if (chapterIds.length) {
      const keys = chapterIds.map((id) =>
        chapterKey(user.id, seriesId, bookId, id)
      );
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Chapter>[];
      for (const res of results) if (res.value) chapters.push(res.value);
    }

    // Fetch book-level scenes
    const bookLevelScenes: Scene[] = [];
    if (bookLevelSceneIds.length) {
      const keys = bookLevelSceneIds.map((id) =>
        sceneKey(user.id, seriesId, bookId, id)
      );
      const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Scene>[];
      for (const res of results) if (res.value) bookLevelScenes.push(res.value);
    }

    // Fetch scenes for each chapter using chapterSceneOrder
    const chapterScenes = new Map<string, Scene[]>();
    for (const chapter of chapters) {
      const sceneIds: string[] = [];
      for await (
        const entry of kv.list({
          prefix: [
            "yawt",
            "chapterSceneOrder",
            user.id,
            seriesId,
            bookId,
            chapter.id,
          ],
        })
      ) {
        const key = entry.key as unknown[];
        const sceneId = key[key.length - 1];
        if (typeof sceneId === "string") sceneIds.push(sceneId);
      }

      if (sceneIds.length) {
        const keys = sceneIds.map((id) =>
          sceneKey(user.id, seriesId, bookId, id)
        );
        const results = (await kv.getMany(keys)) as Deno.KvEntryMaybe<Scene>[];
        const scenes: Scene[] = [];
        for (const res of results) if (res.value) scenes.push(res.value);
        chapterScenes.set(chapter.id, scenes);
      } else {
        chapterScenes.set(chapter.id, []);
      }
    }

    // Combine all scenes for selection purposes
    const allScenes: Scene[] = [
      ...bookLevelScenes,
      ...Array.from(chapterScenes.values()).flat(),
    ];

    const url = new URL(req.url);
    const selectedChapterId = url.searchParams.get("chapter") ?? null;
    const selectedSceneId = url.searchParams.get("scene") ?? allScenes[0]?.id ??
      null;
    const selectedScene = selectedSceneId
      ? (allScenes.find((s) => s.id === selectedSceneId) ?? null)
      : null;

    return ctx.render({
      user,
      series: seriesRes.value,
      allSeries,
      book: bookRes.value,
      chapters,
      scenes: allScenes,
      bookLevelScenes,
      chapterScenes,
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

      // Find last rank in unified book item order
      let lastRank: string | undefined;
      for await (
        const entry of kv.list<BookItem>(
          { prefix: ["yawt", "bookItemOrder", user.id, seriesId, bookId] },
          { reverse: true, limit: 1 },
        )
      ) {
        const key = entry.key as unknown[];
        const maybeRank = key[key.length - 1];
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

      const bookItem: BookItem = { type: "chapter", id };

      const ok = await kv
        .atomic()
        .set(chapterKey(user.id, seriesId, bookId, id), chapter)
        .set(bookItemOrderKey(user.id, seriesId, bookId, rank), bookItem)
        .commit();

      if (!ok.ok) {
        return new Response("Failed to create chapter", { status: 500 });
      }

      return Response.redirect(
        new URL(`/series/${seriesId}/books/${bookId}?chapter=${id}`, req.url),
        303,
      );
    }

    if (action === "createScene") {
      const title = String(form.get("title") ?? "").trim() || "Untitled scene";
      const chapterId = String(form.get("chapterId") ?? "").trim() || undefined;

      let lastRank: string | undefined;

      if (chapterId) {
        // Scene in a chapter - find last rank in that chapter
        for await (
          const entry of kv.list(
            {
              prefix: [
                "yawt",
                "chapterSceneOrder",
                user.id,
                seriesId,
                bookId,
                chapterId,
              ],
            },
            { reverse: true, limit: 1 },
          )
        ) {
          const key = entry.key as unknown[];
          const maybeRank = key[key.length - 2];
          if (typeof maybeRank === "string") lastRank = maybeRank;
        }
      } else {
        // Book-level scene - find last rank in unified book item order
        for await (
          const entry of kv.list<BookItem>(
            { prefix: ["yawt", "bookItemOrder", user.id, seriesId, bookId] },
            { reverse: true, limit: 1 },
          )
        ) {
          const key = entry.key as unknown[];
          const maybeRank = key[key.length - 1];
          if (typeof maybeRank === "string") lastRank = maybeRank;
        }
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

      const atomic = kv
        .atomic()
        .set(sceneKey(user.id, seriesId, bookId, id), scene);

      if (chapterId) {
        // Scene in a chapter - add to chapter scene order
        atomic.set(
          chapterSceneOrderKey(user.id, seriesId, bookId, chapterId, rank, id),
          1,
        );
      } else {
        // Book-level scene - add to unified book item order
        const bookItem: BookItem = { type: "scene", id };
        atomic.set(bookItemOrderKey(user.id, seriesId, bookId, rank), bookItem);
      }

      const ok = await atomic.commit();

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
      const formTags = form
        .getAll("tags")
        .map((t) => String(t))
        .filter((t) => t.trim());

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
  const {
    series,
    allSeries,
    book,
    chapters,
    bookLevelScenes,
    chapterScenes,
    selectedScene,
    selectedChapterId,
  } = data;

  // Prepare data for HierarchicalSceneList
  // Sort book-level scenes by rank
  const sortedBookLevelScenes = [...bookLevelScenes].sort((a, b) =>
    a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0
  );

  const chaptersWithScenes = chapters.map((chapter) => {
    const scenes = chapterScenes.get(chapter.id) ?? [];
    // Sort scenes by rank
    const sortedScenes = [...scenes].sort((a, b) =>
      a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0
    );
    return {
      chapter: { id: chapter.id, title: chapter.title, rank: chapter.rank },
      scenes: sortedScenes.map((s) => ({
        id: s.id,
        title: s.derived?.title || `Scene ${s.id.slice(0, 6)}`,
        rank: s.rank,
        chapterId: s.chapterId,
      })),
    };
  });

  const bookLevelSceneItems = sortedBookLevelScenes.map((s) => ({
    id: s.id,
    title: s.derived?.title || `Scene ${s.id.slice(0, 6)}`,
    rank: s.rank,
    chapterId: s.chapterId,
  }));

  return (
    <Layout
      user={data.user}
      title={series.title}
      series={allSeries}
      currentSeriesId={series.id}
      currentPage="books"
    >
      <div class="grid lg:grid-cols-12 gap-4 mt-3">
        <div class="lg:col-span-4 xl:col-span-3">
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
                  <HierarchicalSceneList
                    seriesId={series.id}
                    bookId={book.id}
                    bookLevelScenes={bookLevelSceneItems}
                    chapters={chaptersWithScenes}
                    selectedSceneId={selectedScene?.id ?? null}
                    selectedChapterId={selectedChapterId}
                  />
                )}
            </div>
          </div>
        </div>

        <div class="lg:col-span-8 xl:col-span-9">
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
