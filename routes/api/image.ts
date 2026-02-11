import { Handlers } from "$fresh/server.ts";
import { badRequest, notFound, requireUser, serverError } from "@utils/http.ts";
import { getObject, getR2Bucket } from "@utils/r2.ts";

/**
 * Image proxy endpoint that serves images from R2 storage.
 * This allows serving images without requiring public R2 access.
 *
 * Usage: GET /api/image?key=yawt/user/{userId}/...
 *
 * The endpoint verifies that the requested image belongs to the authenticated user
 * by checking that the objectKey starts with the expected user prefix.
 */
export const handler: Handlers = {
  async GET(req) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const url = new URL(req.url);
    const objectKey = url.searchParams.get("key");

    if (!objectKey) {
      return badRequest("Missing 'key' parameter");
    }

    // Security check: verify the objectKey belongs to this user
    // Expected format: yawt/user/{userId}/...
    const userPrefix = `yawt/user/${user.id}/`;
    if (!objectKey.startsWith(userPrefix)) {
      return notFound("Image not found");
    }

    const bucket = getR2Bucket();
    if (!bucket) {
      return serverError("Image storage not configured");
    }

    try {
      const result = await getObject({ bucket, key: objectKey });

      if (!result) {
        return notFound("Image not found");
      }

      return new Response(result.body, {
        status: 200,
        headers: {
          "Content-Type": result.contentType ?? "application/octet-stream",
          ...(result.contentLength !== undefined && {
            "Content-Length": String(result.contentLength),
          }),
          // Cache for 1 day in browser, 7 days on CDN
          "Cache-Control": "public, max-age=86400, s-maxage=604800",
        },
      });
    } catch (err) {
      console.error("Failed to fetch image from R2", { error: err, objectKey });
      return serverError("Failed to fetch image");
    }
  },
};
