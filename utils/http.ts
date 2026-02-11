import { getUser } from "./session.ts";
import type { User } from "./session.ts";
import { hasPermission, isAdmin } from "@utils/auth/permissions.ts";
import type { Permission } from "@utils/auth/types.ts";
import { kv } from "./kv.ts";
import { userProfileKey } from "@utils/auth/keys.ts";

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

export function forbidden(message: string) {
  return json({ error: message }, { status: 403 });
}

export function serverError(message = "Internal server error") {
  return json({ error: message }, { status: 500 });
}

export async function requireUser(req: Request): Promise<User | Response> {
  const user = await getUser(req);
  if (!user) return unauthorized();

  // Check the live user profile from KV to ensure blocked status is current
  // This ensures that if a user is blocked, the block takes effect immediately
  // even for users with existing sessions
  const userProfile = await kv.get<{ blocked?: boolean }>(
    userProfileKey(user.id),
  );
  if (userProfile.value?.blocked) {
    return forbidden("Your account has been blocked. Please contact support.");
  }

  return user;
}

/**
 * Require the user to have a specific permission
 */
export async function requirePermission(
  req: Request,
  permission: Permission,
): Promise<User | Response> {
  const userOrRes = await requireUser(req);
  if (userOrRes instanceof Response) return userOrRes;

  if (!hasPermission(userOrRes, permission)) {
    return forbidden("Insufficient permissions");
  }

  return userOrRes;
}

/**
 * Require the user to be an admin
 */
export async function requireAdmin(req: Request): Promise<User | Response> {
  const userOrRes = await requireUser(req);
  if (userOrRes instanceof Response) return userOrRes;

  if (!isAdmin(userOrRes)) {
    return forbidden("Admin access required");
  }

  return userOrRes;
}

export async function readJson(req: Request): Promise<unknown | Response> {
  try {
    return await req.json();
  } catch {
    return badRequest("Invalid JSON in request body");
  }
}
