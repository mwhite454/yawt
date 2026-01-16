import { Handlers } from "$fresh/server.ts";
import { handleCallback } from "@utils/oauth.ts";
import { setUser, type User } from "@utils/session.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const { response, tokens, sessionId } = await handleCallback(req);

      // Fetch user info from GitHub
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userResponse.ok) {
        console.error("Failed to fetch user info from GitHub API");
        return new Response("Failed to authenticate", { status: 500 });
      }

      let githubUser;
      try {
        githubUser = await userResponse.json();
      } catch {
        console.error("Failed to parse GitHub user response");
        return new Response("Failed to authenticate", { status: 500 });
      }

      // Validate required user properties
      if (!githubUser.login || !githubUser.id || !githubUser.avatar_url) {
        console.error("Invalid user data from GitHub");
        return new Response("Failed to authenticate", { status: 500 });
      }

      // Store user in session
      const user: User = {
        login: githubUser.login,
        id: githubUser.id,
        avatar_url: githubUser.avatar_url,
        name: githubUser.name,
        email: githubUser.email,
      };

      await setUser(sessionId, user);

      return response;
    } catch (error) {
      console.error("OAuth callback error:", error);
      return new Response("Authentication failed", { status: 500 });
    }
  },
};
