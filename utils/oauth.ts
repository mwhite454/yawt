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

/**
 * Derive the OAuth redirect URI from the request URL.
 * This allows the app to work on both localhost and production domains.
 * Handles reverse proxy scenarios (like Deno Deploy) by checking forwarded headers.
 */
function getRedirectUri(req: Request): string {
  // Allow explicit override via environment variable
  const envRedirect = Deno.env.get("OAUTH_REDIRECT_URI");
  if (envRedirect) {
    return envRedirect;
  }

  // If CANONICAL_ORIGIN is set, derive the redirect URI from it to avoid
  // client-spoofed forwarded headers influencing OAuth redirect URIs.
  // Use `.origin` to strip any accidental path from the configured value.
  const canonicalOrigin = Deno.env.get("CANONICAL_ORIGIN");
  if (canonicalOrigin) {
    try {
      return `${new URL(canonicalOrigin).origin}/auth/callback`;
    } catch {
      // fall through to forwarded header logic
    }
  }

  const url = new URL(req.url);

  // Normalize comma-separated proxy headers to the first value (RFC 7239).
  const rawForwardedHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const rawForwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = rawForwardedHost?.split(",")[0]?.trim() || null;
  const forwardedProto = rawForwardedProto?.split(",")[0]?.trim() || null;

  // Use forwarded values if available, otherwise fall back to URL.
  const host = forwardedHost || url.host;
  const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;

  return `${protocol}//${host}/auth/callback`;
}

/**
 * Create OAuth configuration with the correct redirect URI for this request.
 */
function createOAuthConfig(redirectUri: string): OAuth2ClientConfig {
  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    authorizationEndpointUri: "https://github.com/login/oauth/authorize",
    tokenUri: "https://github.com/login/oauth/access_token",
    redirectUri,
    defaults: {
      scope: "user:email",
    },
  };
}

// Create default helpers for signOut and getSessionId (don't need dynamic redirect)
const defaultConfig = createOAuthConfig("http://localhost:8000/auth/callback");
const defaultHelpers = createHelpers(defaultConfig);
export const { signOut, getSessionId } = defaultHelpers;

/**
 * Sign in with GitHub OAuth.
 * Dynamically determines the redirect URI from the request.
 */
export async function signIn(req: Request): Promise<Response> {
  const redirectUri = getRedirectUri(req);
  const config = createOAuthConfig(redirectUri);
  const helpers = createHelpers(config);
  return await helpers.signIn(req);
}

/**
 * Handle OAuth callback from GitHub.
 * Dynamically determines the redirect URI from the request.
 */
export async function handleCallback(req: Request) {
  const redirectUri = getRedirectUri(req);
  const config = createOAuthConfig(redirectUri);
  const helpers = createHelpers(config);
  return await helpers.handleCallback(req);
}
