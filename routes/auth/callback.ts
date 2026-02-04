import { Handlers } from "$fresh/server.ts";
import { handleCallback } from "@utils/oauth.ts";
import { setUser, type User } from "@utils/session.ts";
import { isValidTheme } from "@utils/themes.ts";
import { kv } from "@utils/kv.ts";
import { userProfileKey } from "@utils/auth/keys.ts";
import type { SubscriptionTier, UserRole } from "@utils/auth/types.ts";

interface UserProfile {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  subscriptionExpiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
  blocked?: boolean;
}

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

      // Check if user has existing preferences stored by their GitHub ID
      const existingUserPrefs = await kv.get<{ defaultTheme?: string }>([
        "yawt",
        "userPrefs",
        githubUser.id,
      ]);

      // Validate theme from storage before using it
      const storedTheme = existingUserPrefs.value?.defaultTheme;
      const validatedTheme = isValidTheme(storedTheme)
        ? storedTheme
        : undefined;

      // Initialize or update user profile for RBAC
      const now = Date.now();
      const existingProfile = await kv.get<UserProfile>(
        userProfileKey(githubUser.id),
      );

      let currentProfile: UserProfile;
      if (!existingProfile.value) {
        // First sign-in - create profile
        // Check if this is the first user in the system (more efficient with limit)
        const existingProfiles = kv.list({
          prefix: ["yawt", "user_profile"],
          limit: 1,
        });
        let isFirstUser = true;
        for await (const _entry of existingProfiles) {
          isFirstUser = false;
          break;
        }

        currentProfile = {
          id: githubUser.id,
          login: githubUser.login,
          name: githubUser.name,
          avatar_url: githubUser.avatar_url,
          role: isFirstUser ? "admin" : "free",
          createdAt: now,
          updatedAt: now,
        };
        await kv.set(userProfileKey(githubUser.id), currentProfile);
      } else {
        // Update existing profile
        currentProfile = {
          ...existingProfile.value,
          login: githubUser.login,
          name: githubUser.name,
          avatar_url: githubUser.avatar_url,
          updatedAt: now,
        };
        await kv.set(userProfileKey(githubUser.id), currentProfile);
      }

      // Check if this user is the only user in the system
      // If so, automatically grant admin access
      const allProfiles = kv.list({
        prefix: ["yawt", "user_profile"],
        limit: 2, // Only need to check if there are 1 or 2+ users
      });
      let userCount = 0;
      for await (const _entry of allProfiles) {
        userCount++;
        if (userCount > 1) break; // No need to count further
      }

      // If only one user exists, ensure they have admin role
      if (userCount === 1 && currentProfile.role !== "admin") {
        currentProfile = {
          ...currentProfile,
          role: "admin",
          updatedAt: Date.now(), // Use fresh timestamp for role upgrade
        };
        await kv.set(userProfileKey(githubUser.id), currentProfile);
      }

      // Store user in session using the current profile
      const user: User = {
        login: githubUser.login,
        id: githubUser.id,
        avatar_url: githubUser.avatar_url,
        name: githubUser.name,
        email: githubUser.email,
        // Use validated theme preference if available
        defaultTheme: validatedTheme,
        // Include RBAC fields from profile
        role: currentProfile.role,
        subscriptionTier: currentProfile.subscriptionTier,
        subscriptionExpiresAt: currentProfile.subscriptionExpiresAt,
        createdAt: currentProfile.createdAt,
        updatedAt: currentProfile.updatedAt,
        blocked: currentProfile.blocked,
      };

      await setUser(sessionId, user);

      // Also store user preferences by GitHub ID for persistence across sessions
      if (user.defaultTheme) {
        await kv.set(["yawt", "userPrefs", githubUser.id], {
          defaultTheme: user.defaultTheme,
        });
      }

      return response;
    } catch (error) {
      console.error("OAuth callback error:", error);
      return new Response("Authentication failed", { status: 500 });
    }
  },
};
