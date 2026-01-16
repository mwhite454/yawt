/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "../../../components/Layout.tsx";
import { kv } from "../../../utils/kv.ts";
import { getUser, type User } from "../../../utils/session.ts";
import type { Character, Series } from "../../../utils/story/types.ts";
import { characterKey, seriesKey } from "../../../utils/story/keys.ts";
import CharacterImageUploader from "../../../islands/CharacterImageUploader.tsx";

interface Data {
  user: User;
  series: Series;
  characters: Character[];
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

    const characters: Character[] = [];
    for await (
      const entry of kv.list<Character>({
        prefix: ["yawt", "character", user.id, seriesId],
      })
    ) {
      if (entry.value) characters.push(entry.value);
    }

    characters.sort((a, b) => a.name.localeCompare(b.name));

    return ctx.render({ user, series: seriesRes.value, characters });
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
        new URL(`/series/${seriesId}/characters`, req.url),
        303,
      );
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    const character: Character = {
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
      .set(characterKey(user.id, seriesId, id), character)
      .commit();

    if (!ok.ok) {
      return new Response("Failed to create character", { status: 500 });
    }

    return Response.redirect(
      new URL(`/series/${seriesId}/characters`, req.url),
      303,
    );
  },
};

export default function CharactersPage({ data }: PageProps<Data>) {
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
          <li>Characters</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Characters</h1>

            <form method="POST" class="grid gap-3">
              <input
                class="input input-bordered"
                name="name"
                placeholder="Character name"
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
                  Add character
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          {data.characters.map((c) => (
            <div key={c.id} class="card bg-base-100 shadow-sm">
              <div class="card-body">
                <div class="flex items-center gap-3">
                  <div class="avatar placeholder">
                    <div class="bg-neutral text-neutral-content rounded-full w-10">
                      <span>{c.name.slice(0, 1).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div class="font-semibold">{c.name}</div>
                    {c.description && (
                      <div class="text-sm opacity-80">{c.description}</div>
                    )}
                  </div>
                </div>

                <div class="divider my-2" />

                <CharacterImageUploader
                  seriesId={data.series.id}
                  characterId={c.id}
                  existingObjectKey={c.image?.objectKey}
                  existingContentType={c.image?.contentType}
                />
              </div>
            </div>
          ))}
        </div>

        {data.characters.length === 0 && (
          <div class="alert">
            <span>No characters yet.</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
