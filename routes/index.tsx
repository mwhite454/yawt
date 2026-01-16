import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { getUser, type User } from "@utils/session.ts";

interface Data {
  user: User | null;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    return ctx.render({ user });
  },
};

export default function Home({ data }: PageProps<Data>) {
  const { user } = data;

  return (
    <Layout user={user} title="YAWT">
      <div class="grid gap-4">
        <div class="hero bg-base-100 rounded-box shadow-sm">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-4xl font-bold">YAWT</h1>
              <p class="py-4 opacity-80">Yet Another Writing Tool</p>
              {user ? (
                <div class="flex flex-col gap-2 items-center">
                  <a class="btn btn-primary" href="/series">
                    Open your series
                  </a>
                  <div class="text-sm opacity-70">
                    Signed in as {user.name || user.login}
                  </div>
                </div>
              ) : (
                <a class="btn btn-primary" href="/auth/signin">
                  Sign in with GitHub
                </a>
              )}
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h2 class="card-title">What’s here</h2>
            <ul class="list-disc pl-5 opacity-80">
              <li>Series → Books → Scenes (YAML frontmatter supported)</li>
              <li>Characters, Locations, Timelines</li>
              <li>API is KV-backed and OAuth-protected</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
