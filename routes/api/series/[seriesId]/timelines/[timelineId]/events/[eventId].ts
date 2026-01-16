import { Handlers } from "$fresh/server.ts";
import { badRequest, requireUser } from "../../../../../../../utils/http.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    ctx.params; // keep ctx referenced
    return badRequest(
      "Timeline events are derived from Scenes now. Edit scene YAML frontmatter (startDate/endDate, timelines) instead.",
    );
  },

  async PUT(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    ctx.params;
    return badRequest(
      "Timeline events are derived from Scenes now. Edit scene YAML frontmatter (startDate/endDate, timelines) instead.",
    );
  },

  async DELETE(req, ctx) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    ctx.params;
    return badRequest(
      "Timeline events are derived from Scenes now. Edit scene YAML frontmatter (startDate/endDate, timelines) instead.",
    );
  },
};
