import {
  createGitHubOAuthConfig,
  createHelpers,
} from "@deno/kv-oauth";

// Get environment variables
const GITHUB_CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID") || "";
const GITHUB_CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET") || "";

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.warn(
    "⚠️  Warning: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in environment variables or .env file",
  );
}

// Create OAuth configuration for GitHub
export const oauthConfig = createGitHubOAuthConfig({
  redirectUri: Deno.env.get("OAUTH_REDIRECT_URI") ||
    "http://localhost:8000/auth/callback",
  scope: "user:email",
});

// Create OAuth helpers
export const {
  signIn,
  signOut,
  handleCallback,
  getSessionId,
} = createHelpers(oauthConfig);
