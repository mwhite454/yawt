/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";

import type { Character, CharacterType, Series } from "@utils/story/types.ts";
import {
  characterKey,
  characterTypeKey,
  seriesKey,
} from "@utils/story/keys.ts";
import { getAllSeriesForUser } from "@utils/story/series.ts";
import CharacterImageUploader from "@islands/CharacterImageUploader.tsx";
import KeyValueEditor from "@islands/KeyValueEditor.tsx";
import CharacterForm from "@islands/CharacterForm.tsx";

interface Data {
  user: User;
  series: Series;
  allSeries: Series[];
  characters: Character[];
  characterTypes: CharacterType[];
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

    const characters: Character[] = [];
    for await (
      const entry of kv.list<Character>({
        prefix: ["yawt", "character", user.id, seriesId],
      })
    ) {
      if (entry.value) characters.push(entry.value);
    }

    const characterTypes: CharacterType[] = [];
    for await (
      const entry of kv.list<CharacterType>({
        prefix: ["yawt", "characterType", user.id, seriesId],
      })
    ) {
      if (entry.value) characterTypes.push(entry.value);
    }

    characters.sort((a, b) => a.name.localeCompare(b.name));
    characterTypes.sort((a, b) => a.name.localeCompare(b.name));

    return ctx.render({
      user,
      series: seriesRes.value,
      allSeries,
      characters,
      characterTypes,
    });
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
    <Layout
      user={data.user}
      title={data.series.title}
      series={data.allSeries}
      currentSeriesId={data.series.id}
      currentPage="characters"
    >
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
            <div class="flex items-center justify-between">
              <h1 class="card-title">Characters</h1>
              <a
                href={`/series/${data.series.id}/character-types`}
                class="btn btn-sm btn-outline"
              >
                Manage Character Types
              </a>
            </div>

            <div class="divider" />

            <CharacterForm
              seriesId={data.series.id}
              characterTypes={data.characterTypes}
            />
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          {data.characters.map((c) => {
            const charType = data.characterTypes.find(
              (ct) => ct.id === c.characterTypeId,
            );
            return (
              <div key={c.id} class="card bg-base-100 shadow-sm">
                <div class="card-body">
                  <div class="flex items-center gap-3">
                    <div class="avatar placeholder">
                      <div class="bg-neutral text-neutral-content rounded-full w-10">
                        <span>{c.name.slice(0, 1).toUpperCase()}</span>
                      </div>
                    </div>
                    <div class="flex-1">
                      <div class="font-semibold">{c.name}</div>
                      {c.description && (
                        <div class="text-sm opacity-80">{c.description}</div>
                      )}
                      {charType && (
                        <div class="badge badge-sm badge-primary mt-1">
                          {charType.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {charType && c.typeData && (
                    <>
                      <div class="divider my-2" />
                      <div class="grid gap-2">
                        <div class="text-sm font-semibold opacity-70">
                          {charType.name} Details:
                        </div>
                        {charType.fields.map((field) => {
                          const value = c.typeData?.[field.name];
                          if (
                            value === undefined || value === null ||
                            value === ""
                          ) {
                            return null;
                          }
                          return (
                            <div key={field.name} class="text-sm pl-2">
                              <span class="font-semibold">{field.label}:</span>
                              {" "}
                              {Array.isArray(value)
                                ? value.join(", ")
                                : String(value)}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div class="divider my-2" />

                  <CharacterImageUploader
                    seriesId={data.series.id}
                    characterId={c.id}
                    existingObjectKey={c.image?.objectKey}
                    existingContentType={c.image?.contentType}
                  />

                  <div class="divider my-2" />

                  <KeyValueEditor
                    seriesId={data.series.id}
                    characterId={c.id}
                    initialExtra={c.extra}
                  />
                </div>
              </div>
            );
          })}
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
