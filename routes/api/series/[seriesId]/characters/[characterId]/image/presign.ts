import { Handlers } from "$fresh/server.ts";
import {
  badRequest,
  json,
  notFound,
  readJson,
  requireUser,
} from "../../../../../../../utils/http.ts";
import { kv } from "../../../../../../../utils/kv.ts";
import {
  characterKey,
  seriesKey,
} from "../../../../../../../utils/story/keys.ts";
import type { Character } from "../../../../../../../utils/story/types.ts";
import {
  getR2Bucket,
  presignPutObject,
} from "../../../../../../../utils/r2.ts";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const handler: Handlers = {
  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const { seriesId, characterId } = ctx.params;

    const series = await kv.get(seriesKey(user.id, seriesId));
    if (!series.value) return notFound("Series not found");

    const character = await kv.get<Character>(
      characterKey(user.id, seriesId, characterId),
    );
    if (!character.value) return notFound("Character not found");

    const bodyOrRes = await readJson(req);
    if (bodyOrRes instanceof Response) return bodyOrRes;
    const body = bodyOrRes as Record<string, unknown>;

    const contentType = typeof body.contentType === "string"
      ? body.contentType.trim()
      : "";
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return badRequest("Unsupported contentType");
    }

    const bucket = getR2Bucket();
    if (!bucket) {
      return json({ error: "Missing R2 bucket env var" }, { status: 500 });
    }

    const objectKey =
      `yawt/user/${user.id}/series/${seriesId}/characters/${characterId}/${crypto.randomUUID()}`;

    let uploadUrl: string;
    try {
      uploadUrl = await presignPutObject({
        bucket,
        key: objectKey,
        contentType,
        expiresInSeconds: 900,
      });
    } catch (err) {
      return json(
        { error: "Failed to presign upload", detail: String(err) },
        {
          status: 500,
        },
      );
    }

    return json(
      {
        uploadUrl,
        objectKey,
        headers: { "Content-Type": contentType },
        expiresInSeconds: 900,
      },
      { status: 200 },
    );
  },
};
