import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, notFound, requireAdmin } from "@utils/http.ts";
import {
  allUserProfilesPrefix,
  auditLogKey,
  userProfileKey,
} from "@utils/auth/keys.ts";
import type { SubscriptionTier, UserRole } from "@utils/auth/types.ts";

interface UserProfile {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  subscriptionExpiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
  blocked?: boolean;
}

interface AuditLogEntry {
  timestamp: number;
  adminId: number;
  adminLogin: string;
  action: string;
  targetUserId: number;
  details: Record<string, unknown>;
}

export const handler: Handlers = {
  /**
   * GET /api/admin/users - List all users (admin only)
   */
  async GET(req) {
    const adminOrRes = await requireAdmin(req);
    if (adminOrRes instanceof Response) return adminOrRes;

    const users: UserProfile[] = [];
    for await (
      const entry of kv.list<UserProfile>({
        prefix: allUserProfilesPrefix(),
      })
    ) {
      if (entry.value) users.push(entry.value);
    }

    users.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    return json({ users }, { status: 200 });
  },

  /**
   * PATCH /api/admin/users - Update a user's role (admin only)
   * Body: { userId: number, role: UserRole }
   */
  async PATCH(req) {
    const adminOrRes = await requireAdmin(req);
    if (adminOrRes instanceof Response) return adminOrRes;
    const admin = adminOrRes;

    let requestBody: { userId?: number; role?: UserRole };
    try {
      requestBody = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { userId, role } = requestBody;

    if (!userId || typeof userId !== "number") {
      return badRequest("userId is required and must be a number");
    }

    if (!role || !["admin", "subscriber", "free"].includes(role)) {
      return badRequest("role must be one of: admin, subscriber, free");
    }

    if (userId === admin.id && role !== "admin") {
      return badRequest("Cannot change your own admin role");
    }

    const userRes = await kv.get<UserProfile>(userProfileKey(userId));
    if (!userRes.value) {
      return notFound("User not found");
    }

    const now = Date.now();
    const previousRole = userRes.value.role ?? "free";

    const updatedUser: UserProfile = {
      ...userRes.value,
      role,
      updatedAt: now,
    };

    const auditEntry: AuditLogEntry = {
      timestamp: now,
      adminId: admin.id,
      adminLogin: admin.login,
      action: "role_change",
      targetUserId: userId,
      details: {
        previousRole,
        newRole: role,
      },
    };

    const result = await kv
      .atomic()
      .check(userRes)
      .set(userProfileKey(userId), updatedUser)
      .set(auditLogKey(now, "role_change"), auditEntry)
      .commit();

    if (!result.ok) {
      return new Response("Failed to update user (concurrent modification)", {
        status: 409,
      });
    }

    return json({ user: updatedUser }, { status: 200 });
  },

  /**
   * PUT /api/admin/users - Block or unblock a user (admin only)
   * Body: { userId: number, blocked: boolean }
   */
  async PUT(req) {
    const adminOrRes = await requireAdmin(req);
    if (adminOrRes instanceof Response) return adminOrRes;
    const admin = adminOrRes;

    let requestBody: { userId?: number; blocked?: boolean };
    try {
      requestBody = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { userId, blocked } = requestBody;

    if (!userId || typeof userId !== "number") {
      return badRequest("userId is required and must be a number");
    }

    if (typeof blocked !== "boolean") {
      return badRequest("blocked must be a boolean");
    }

    if (userId === admin.id) {
      return badRequest("Cannot block yourself");
    }

    const userRes = await kv.get<UserProfile>(userProfileKey(userId));
    if (!userRes.value) {
      return notFound("User not found");
    }

    const now = Date.now();

    const updatedUser: UserProfile = {
      ...userRes.value,
      blocked,
      updatedAt: now,
    };

    const auditEntry: AuditLogEntry = {
      timestamp: now,
      adminId: admin.id,
      adminLogin: admin.login,
      action: blocked ? "user_blocked" : "user_unblocked",
      targetUserId: userId,
      details: {
        blocked,
      },
    };

    const result = await kv
      .atomic()
      .check(userRes)
      .set(userProfileKey(userId), updatedUser)
      .set(
        auditLogKey(now, blocked ? "user_blocked" : "user_unblocked"),
        auditEntry,
      )
      .commit();

    if (!result.ok) {
      return new Response("Failed to update user (concurrent modification)", {
        status: 409,
      });
    }

    return json({ user: updatedUser }, { status: 200 });
  },
};
