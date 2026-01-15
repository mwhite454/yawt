import { Handlers } from "$fresh/server.ts";
import { signOut, getSessionId } from "../../utils/oauth.ts";
import { deleteUser } from "../../utils/session.ts";

export const handler: Handlers = {
  async GET(req) {
    const sessionId = await getSessionId(req);
    if (sessionId) {
      await deleteUser(sessionId);
    }
    return await signOut(req);
  },
};
