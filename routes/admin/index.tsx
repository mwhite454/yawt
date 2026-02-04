/// <reference lib="deno.unstable" />

import { Handlers, PageProps } from "$fresh/server.ts";
import { Layout } from "@components/Layout.tsx";
import { getUser, type User } from "@utils/session.ts";
import { isAdmin } from "@utils/auth/permissions.ts";
import AdminDashboard from "@islands/AdminDashboard.tsx";

interface Data {
  user: User;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const user = await getUser(req);
    if (!user) return Response.redirect(new URL("/auth/signin", req.url), 303);

    // Check if user is admin
    if (!isAdmin(user)) {
      return new Response("Forbidden - Admin access required", { status: 403 });
    }

    return ctx.render({ user });
  },
};

export default function AdminPage({ data }: PageProps<Data>) {
  return (
    <Layout user={data.user} title="Admin Dashboard">
      <div class="grid gap-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h1 class="card-title text-2xl">Admin Dashboard</h1>
            <p class="opacity-80">
              Manage users, roles, and application access.
            </p>
          </div>
        </div>

        <AdminDashboard />
      </div>
    </Layout>
  );
}
