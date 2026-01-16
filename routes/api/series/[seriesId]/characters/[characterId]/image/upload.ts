import { Handlers } from "$fresh/server.ts";
import { badRequest, json, notFound, requireUser } from "@utils/http.ts";
import { kv } from "@utils/kv.ts";
import { characterKey, seriesKey } from "@utils/story/keys.ts";
import type { Character } from "@utils/story/types.ts";
import { getR2Bucket, putObject } from "@utils/r2.ts";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

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

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return badRequest("Invalid multipart/form-data");
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return badRequest("Missing file");
    }

    if (file.size <= 0) {
      return badRequest("Empty file");
    }

    if (file.size > MAX_BYTES) {
      return badRequest(`File too large (max ${MAX_BYTES} bytes)`);
    }

    const contentType = file.type?.trim() ?? "";
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return badRequest("Unsupported contentType");
    }

    const bucket = getR2Bucket();
    if (!bucket) {
      return json({ error: "Missing R2 bucket env var" }, { status: 500 });
    }

    const objectKey =
      `yawt/user/${user.id}/series/${seriesId}/characters/${characterId}/${crypto.randomUUID()}`;

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await putObject({
        bucket,
        key: objectKey,
        contentType,
        body: bytes,
      });
    } catch (err) {
      return json(
        { error: "Failed to upload", detail: String(err) },
        { status: 500 },
      );
    }

    return json(
      {
        objectKey,
        contentType,
        bytes: file.size,
      },
      { status: 200 },
    );
  },
};
