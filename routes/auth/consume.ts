import { Handlers } from "$fresh/server.ts";
import { authHandoffKey } from "@utils/oauth.ts";
import { kv } from "@utils/kv.ts";
import { setCookie } from "$std/http/cookie.ts";

interface AuthHandoffRecord {
  sessionId: string;
}

function normalizeReturnPath(value: string | null): string {
  if (!value) return "/client/series";

  if (!value.startsWith("/")) return "/client/series";
  if (value.startsWith("//")) return "/client/series";

  return value;
}

export const handler: Handlers = {
  async GET(req) {
    const requestUrl = new URL(req.url);
    const token = requestUrl.searchParams.get("token");
    if (!token) {
      return new Response("Missing handoff token", { status: 400 });
    }

    const result = await kv.get<AuthHandoffRecord>(authHandoffKey(token));
    if (!result.value?.sessionId) {
      return new Response("Invalid or expired handoff token", { status: 400 });
    }

    await kv.delete(authHandoffKey(token));

    const returnPath = normalizeReturnPath(
      requestUrl.searchParams.get("return_to"),
    );
    const redirectUrl = new URL(returnPath, requestUrl.origin);

    const response = Response.redirect(redirectUrl, 303);
    setCookie(response.headers, {
      name: "session",
      value: result.value.sessionId,
      path: "/",
      httpOnly: true,
      secure: requestUrl.protocol === "https:",
      sameSite: "Lax",
    });

    return response;
  },
};
