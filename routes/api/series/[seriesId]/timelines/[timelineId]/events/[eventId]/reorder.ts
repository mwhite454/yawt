import { Handlers } from "$fresh/server.ts";
import { badRequest, requireUser } from "../../../../../../../../utils/http.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    ctx.params;
    return badRequest(
      "Events are derived from Scenes now. Ordering is chronological (startDate/endDate) rather than manually ranked.",
    );
  },
};
