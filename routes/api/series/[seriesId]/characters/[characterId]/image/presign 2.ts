import { Handlers } from "$fresh/server.ts";
import { json } from "../../../../../../../utils/http.ts";

// Direct-to-R2 presigned uploads were removed in favor of a same-origin upload API.
// This avoids browser↔R2 CORS issues and keeps auth/validation server-side.
export const handler: Handlers = {
  POST() {
    return json(
      { error: "Gone", detail: "Use /image/upload instead" },
      { status: 410 },
    );
  },
};
