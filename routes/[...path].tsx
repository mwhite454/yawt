import type { Handlers } from "$fresh/server.ts";

/**
 * Catch-all route that serves the React SPA for all non-API, non-auth paths.
 * The React client is built to static/client/ via `npm run build`.
 */
export const handler: Handlers = {
  async GET() {
    const indexPath = new URL("../static/client/index.html", import.meta.url);
    try {
      const html = await Deno.readTextFile(indexPath);
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
          pragma: "no-cache",
          expires: "0",
        },
      });
    } catch {
      return new Response(
        "React app not built. Run: cd client && npm run build",
        { status: 503 },
      );
    }
  },
};
