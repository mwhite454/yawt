/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { CharacterType, Series } from "@utils/story/types.ts";
import { characterTypeKey, seriesKey } from "@utils/story/keys.ts";

interface Data {
  user: User;
  series: Series;
  characterTypes: CharacterType[];
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

    const characterTypes: CharacterType[] = [];
    for await (
      const entry of kv.list<CharacterType>({
        prefix: ["yawt", "characterType", user.id, seriesId],
      })
    ) {
      if (entry.value) characterTypes.push(entry.value);
    }

    characterTypes.sort((a, b) => a.name.localeCompare(b.name));

    return ctx.render({
      user,
      series: seriesRes.value,
      characterTypes,
    });
  },
};

export default function CharacterTypesPage({ data }: PageProps<Data>) {
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
          <li>
            <a href={`/series/${data.series.id}/characters`}>Characters</a>
          </li>
          <li>Character Types</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Character Types</h1>
            <p class="text-sm opacity-80">
              Define custom templates with specific fields for different types
              of characters.
            </p>

            <div class="divider" />

            <div class="grid gap-3 mt-2">
              <a
                href={`/series/${data.series.id}/character-types/new`}
                class="btn btn-primary"
              >
                Create New Character Type
              </a>
            </div>
          </div>
        </div>

        <div class="grid gap-3">
          {data.characterTypes.map((ct) => (
            <div key={ct.id} class="card bg-base-100 shadow-sm">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-lg">{ct.name}</div>
                    {ct.description && (
                      <div class="text-sm opacity-80 mt-1">
                        {ct.description}
                      </div>
                    )}
                  </div>
                  <a
                    href={`/series/${data.series.id}/character-types/${ct.id}`}
                    class="btn btn-sm btn-primary"
                  >
                    Edit
                  </a>
                </div>

                {ct.fields.length > 0 && (
                  <>
                    <div class="divider my-2" />
                    <div class="grid gap-1">
                      <div class="text-sm font-semibold opacity-70">
                        Fields ({ct.fields.length}):
                      </div>
                      <div class="grid gap-1 pl-3">
                        {ct.fields.map((field, idx) => (
                          <div key={idx} class="text-sm">
                            <span class="font-mono text-xs bg-base-200 px-1 rounded">
                              {field.name}
                            </span>
                            {" "}
                            <span class="opacity-70">
                              ({field.type}
                              {field.required ? ", required" : ""})
                            </span>
                            {field.options && field.options.length > 0 && (
                              <span class="text-xs opacity-60">
                                {" "}
                                - options: {field.options.join(", ")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.characterTypes.length === 0 && (
          <div class="alert">
            <span>
              No character types yet. Create one to define custom fields for
              your characters.
            </span>
          </div>
        )}
      </div>
    </Layout>
  );
}
