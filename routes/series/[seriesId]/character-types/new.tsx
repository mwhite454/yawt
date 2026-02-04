/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { kv } from "@utils/kv.ts";
import { getUser, type User } from "@utils/session.ts";
import type { Series } from "@utils/story/types.ts";
import { seriesKey } from "@utils/story/keys.ts";
import CharacterTypeEditor from "@islands/CharacterTypeEditor.tsx";

interface Data {
  user: User;
  series: Series;
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

    return ctx.render({
      user,
      series: seriesRes.value,
    });
  },
};

export default function NewCharacterTypePage({ data }: PageProps<Data>) {
  return (
    <Layout user={data.user} title={data.series.title}>
      <div class="grid gap-4 mt-3">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title">Create Character Type</h1>

            <div class="divider" />

            <CharacterTypeEditor seriesId={data.series.id} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
