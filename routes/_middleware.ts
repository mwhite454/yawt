import type { FreshContext } from "$fresh/server.ts";

function firstForwardedValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname === "::1";
}

function getCanonicalOrigin(): URL | null {
  // Prefer an explicit canonical origin (e.g. "https://www.7syllable.com").
  const canonicalOrigin = Deno.env.get("CANONICAL_ORIGIN");
  if (canonicalOrigin) {
    try {
      const url = new URL(canonicalOrigin);
      if (url.origin) return url;
    } catch {
      console.error(
        "Invalid CANONICAL_ORIGIN. Skipping host canonicalization.",
      );
      return null;
    }
  }

  // Fall back to deriving the origin from OAUTH_REDIRECT_URI.
  const redirectUri = Deno.env.get("OAUTH_REDIRECT_URI");
  if (!redirectUri) return null;

  try {
    return new URL(redirectUri).origin ? new URL(redirectUri) : null;
  } catch {
    console.error(
      "Invalid OAUTH_REDIRECT_URI. Skipping host canonicalization.",
    );
    return null;
  }
}

export async function handler(
  req: Request,
  ctx: FreshContext,
): Promise<Response> {
  const canonicalUrl = getCanonicalOrigin();
  if (!canonicalUrl) {
    return await ctx.next();
  }

  const requestUrl = new URL(req.url);

  // Never redirect local development traffic.
  if (isLocalHostname(requestUrl.hostname)) {
    return await ctx.next();
  }

  const forwardedHost = firstForwardedValue(
    req.headers.get("x-forwarded-host"),
  );
  const forwardedProto = firstForwardedValue(
    req.headers.get("x-forwarded-proto"),
  );

  const requestHost = forwardedHost || requestUrl.host;
  const requestProtocol = forwardedProto
    ? `${forwardedProto}:`
    : requestUrl.protocol;
  const requestOrigin = `${requestProtocol}//${requestHost}`.toLowerCase();
  const canonicalOrigin = canonicalUrl.origin.toLowerCase();

  if (requestOrigin === canonicalOrigin) {
    return await ctx.next();
  }

  const redirectUrl = new URL(req.url);
  redirectUrl.protocol = canonicalUrl.protocol;
  redirectUrl.host = canonicalUrl.host;

  return Response.redirect(redirectUrl, 308);
}
