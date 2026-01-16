import { getUser } from "./session.ts";
import type { User } from "./session.ts";

export function json(data: unknown, init: ResponseInit & { status: number }) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(message = "Not found") {
  return json({ error: message }, { status: 404 });
}

export async function requireUser(req: Request): Promise<User | Response> {
  const user = await getUser(req);
  if (!user) return unauthorized();
  return user;
}

export async function readJson(req: Request): Promise<unknown | Response> {
  try {
    return await req.json();
  } catch {
    return badRequest("Invalid JSON in request body");
  }
}
