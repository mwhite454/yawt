import { createGitHubOAuthConfig, createHelpers } from "@deno/kv-oauth";

// Get environment variables
const OAUTH_CLIENT_ID = Deno.env.get("OAUTH_CLIENT_ID");
const OAUTH_CLIENT_SECRET = Deno.env.get("OAUTH_CLIENT_SECRET");

if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
  console.error(
    "❌ Error: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET must be set in environment variables or .env file",
  );
  console.error(
    "   See SETUP.md for instructions on creating a GitHub OAuth App",
  );
  throw new Error("Missing required OAuth configuration");
}

// Create OAuth configuration for GitHub
export const oauthConfig = createGitHubOAuthConfig({
  redirectUri:
    Deno.env.get("OAUTH_REDIRECT_URI") || "http://localhost:8000/auth/callback",
  scope: "user:email",
});

// Create OAuth helpers
export const { signIn, signOut, handleCallback, getSessionId } =
  createHelpers(oauthConfig);
