import { Handlers } from "$fresh/server.ts";
import { getUser } from "@utils/session.ts";

export const handler: Handlers = {
  async GET(req) {
    const user = await getUser(req);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
