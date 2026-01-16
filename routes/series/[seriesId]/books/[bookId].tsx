/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "../../../../components/Layout.tsx";
import { kv } from "../../../../utils/kv.ts";
import { getUser, type User } from "../../../../utils/session.ts";
import type { Book, Scene, Series } from "../../../../utils/story/types.ts";
import {
  bookKey,
  sceneKey,
  sceneOrderKey,
  seriesKey,
} from "../../../../utils/story/keys.ts";
import { rankAfter, rankInitial } from "../../../../utils/story/rank.ts";
import { deriveSceneFields } from "../../../../utils/story/frontmatter.ts";

interface Data {
  user: User;
  series: Series;
  book: Book;
  scenes: Scene[];
  selectedScene: Scene | null;
  selectedSceneId: string | null;
}

function defaultSceneText(title: string) {
  return `---\ntitle: ${title}\n---\n\n`;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const { seriesId, bookId } = ctx.params;

    const [seriesRes, bookRes] = await Promise.all([
      kv.get<Series>(seriesKey(user.id, seriesId)),
      kv.get<Book>(bookKey(user.id, seriesId, bookId)),
    ]);

    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }
    if (!bookRes.value) return new Response("Book not found", { status: 404 });

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
    const selectedSceneId = url.searchParams.get("scene") ?? scenes[0]?.id ??
      null;
    const selectedScene = selectedSceneId
      ? scenes.find((s) => s.id === selectedSceneId) ?? null
      : null;

    return ctx.render({
      user,
      series: seriesRes.value,
      book: bookRes.value,
      scenes,
      selectedScene,
      selectedSceneId,
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

    if (action === "createScene") {
      const title = String(form.get("title") ?? "").trim() || "Untitled scene";

      let lastRank: string | undefined;
      for await (
        const entry of kv.list(
          { prefix: ["yawt", "sceneOrder", user.id, seriesId, bookId] },
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
        rank,
        text,
        derived,
        createdAt: now,
        updatedAt: now,
      };

      const ok = await kv
        .atomic()
        .set(sceneKey(user.id, seriesId, bookId, id), scene)
        .set(sceneOrderKey(user.id, seriesId, bookId, rank, id), 1)
        .commit();

      if (!ok.ok) {
        return new Response("Failed to create scene", { status: 500 });
      }

      return Response.redirect(
        new URL(`/series/${seriesId}/books/${bookId}?scene=${id}`, req.url),
        303,
      );
    }

    if (action === "saveScene") {
      const sceneId = String(form.get("sceneId") ?? "").trim();
      const text = String(form.get("text") ?? "");

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
  const { series, book, scenes, selectedScene } = data;

  return (
    <Layout user={data.user} title={series.title}>
      <div class="breadcrumbs text-sm">
        <ul>
          <li>
            <a href="/series">Series</a>
          </li>
          <li>
            <a href={`/series/${series.id}`}>{series.title}</a>
          </li>
          <li>{book.title}</li>
        </ul>
      </div>

      <div class="grid lg:grid-cols-12 gap-4 mt-3">
        <div class="lg:col-span-4">
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="flex items-center justify-between gap-2">
                <h2 class="card-title">Scenes</h2>
                <details class="dropdown dropdown-end">
                  <summary class="btn btn-sm">New</summary>
                  <div class="dropdown-content z-10 card card-compact bg-base-100 shadow w-80">
                    <div class="card-body">
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
                        <button class="btn btn-primary btn-sm" type="submit">
                          Create
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              </div>

              <div class="divider my-2" />

              {scenes.length === 0
                ? (
                  <div class="alert">
                    <span>No scenes yet. Create one.</span>
                  </div>
                )
                : (
                  <ul class="menu bg-base-200 rounded-box">
                    {scenes.map((s) => {
                      const active = selectedScene?.id === s.id;
                      const title = s.derived?.title ||
                        `Scene ${s.id.slice(0, 6)}`;
                      return (
                        <li key={s.id}>
                          <a
                            class={active ? "active" : ""}
                            href={`/series/${series.id}/books/${book.id}?scene=${s.id}`}
                          >
                            {title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
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
                      rows={22}
                      value={selectedScene.text}
                    />

                    <div class="card-actions justify-between">
                      <div class="text-sm opacity-70">
                        YAML frontmatter supported at top of text.
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
