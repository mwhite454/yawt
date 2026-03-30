import { Handlers } from "$fresh/server.ts";
import { getSessionId } from "@utils/oauth.ts";
import {
  DAISYUI_THEMES,
  type DaisyUITheme,
  getUser,
  setUser,
} from "@utils/session.ts";
import { DEFAULT_THEME } from "@utils/themes.ts";
import { kv } from "@utils/kv.ts";

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
          defaultTheme: user.defaultTheme || DEFAULT_THEME,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          blocked: user.blocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },

  async PATCH(req) {
    const sessionId = await getSessionId(req);
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await getUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { defaultTheme } = body;

    // Validate theme if provided
    if (defaultTheme !== undefined) {
      if (!DAISYUI_THEMES.includes(defaultTheme as DaisyUITheme)) {
        return new Response(JSON.stringify({ error: "Invalid theme" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      user.defaultTheme = defaultTheme as DaisyUITheme;
    }

    // Save updated user to session
    await setUser(sessionId, user);

    // Also persist theme preference by GitHub user ID for cross-session persistence
    if (user.defaultTheme) {
      await kv.set(["yawt", "userPrefs", user.id], {
        defaultTheme: user.defaultTheme,
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
          defaultTheme: user.defaultTheme || DEFAULT_THEME,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          blocked: user.blocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
};
