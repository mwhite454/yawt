import { getSessionId } from "./oauth.ts";

const kv = await Deno.openKv();

export interface User {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  email?: string;
}

export async function getUser(request: Request): Promise<User | null> {
  const sessionId = await getSessionId(request);
  if (!sessionId) {
    return null;
  }

  const user = await kv.get<User>(["users", sessionId]);
  return user.value;
}

export async function setUser(sessionId: string, user: User): Promise<void> {
  await kv.set(["users", sessionId], user);
}

export async function deleteUser(sessionId: string): Promise<void> {
  await kv.delete(["users", sessionId]);
}
