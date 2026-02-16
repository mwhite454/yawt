import { createHelpers, type OAuth2ClientConfig } from "@deno/kv-oauth";

// Validate required environment variables
// Note: We use OAUTH_* prefix because GITHUB_* is reserved by GitHub Actions/Deploy
const clientId = Deno.env.get("OAUTH_CLIENT_ID");
const clientSecret = Deno.env.get("OAUTH_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  console.error(
    "❌ Error: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET must be set in environment variables or .env file",
  );
  console.error(
    "   See SETUP.md for instructions on creating a GitHub OAuth App",
  );
  throw new Error("Missing required OAuth configuration");
}

// Create OAuth configuration for GitHub manually
// We can't use createGitHubOAuthConfig because it requires GITHUB_* env vars
export const oauthConfig: OAuth2ClientConfig = {
  clientId,
  clientSecret,
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  redirectUri:
    Deno.env.get("OAUTH_REDIRECT_URI") || "http://localhost:8000/auth/callback",
  defaults: {
    scope: "user:email",
  },
};

// Create OAuth helpers
export const { signIn, signOut, handleCallback, getSessionId } =
  createHelpers(oauthConfig);
