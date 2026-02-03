/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { CharacterType, Series } from "@utils/story/types.ts";
import { characterTypeKey, seriesKey } from "@utils/story/keys.ts";
import CharacterTypeEditor from "@islands/CharacterTypeEditor.tsx";

interface Data {
  user: User;
  series: Series;
  characterType: CharacterType;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    const seriesId = ctx.params.seriesId;
    const typeId = ctx.params.typeId;

    const seriesRes = await kv.get<Series>(seriesKey(user.id, seriesId));
    if (!seriesRes.value) {
      return new Response("Series not found", { status: 404 });
    }

    const typeRes = await kv.get<CharacterType>(
      characterTypeKey(user.id, seriesId, typeId),
    );
    if (!typeRes.value) {
      return new Response("Character type not found", { status: 404 });
    }

    return ctx.render({
      user,
      series: seriesRes.value,
      characterType: typeRes.value,
    });
  },
};

export default function EditCharacterTypePage({ data }: PageProps<Data>) {
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
          <li>
            <a href={`/series/${data.series.id}/character-types`}>
              Character Types
            </a>
          </li>
          <li>{data.characterType.name}</li>
        </ul>
      </div>

      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Edit Character Type</h1>

            <div class="divider" />

            <CharacterTypeEditor
              seriesId={data.series.id}
              typeId={data.characterType.id}
              initialName={data.characterType.name}
              initialDescription={data.characterType.description}
              initialFields={data.characterType.fields}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
