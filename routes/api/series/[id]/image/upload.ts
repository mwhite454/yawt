import { Handlers } from "$fresh/server.ts";
import { badRequest, json, notFound, requireUser } from "@utils/http.ts";
import { kv } from "@utils/kv.ts";
import { seriesKey } from "@utils/story/keys.ts";
import type { Series } from "@utils/story/types.ts";
import { getR2Bucket, putObject } from "@utils/r2.ts";
import { ALLOWED_CONTENT_TYPES, MAX_BYTES } from "@utils/image-upload.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const { id: seriesId } = ctx.params;

    const series = await kv.get<Series>(seriesKey(user.id, seriesId));
    if (!series.value) return notFound("Series not found");

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
      `yawt/user/${user.id}/series/${seriesId}/icon/${crypto.randomUUID()}`;

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await putObject({
        bucket,
        key: objectKey,
        contentType,
        body: bytes,
      });
    } catch (err) {
      console.error("Failed to upload series image to R2", {
        error: err,
        userId: user.id,
        seriesId,
        objectKey,
      });
      return json(
        { error: "Failed to upload" },
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
