# RBAC Implementation Plan for YAWT

## Summary

Implement Role-Based Access Control (RBAC) to support:

- **Admin users** - Manage all users and subscriptions
- **Subscriber users** - Full access to all features, no limits
- **Free users** - Limited to 1 series with up to 3 books

---

## File Structure

```
utils/
├── auth/
│   ├── types.ts          # NEW: Role, Permission, and limit definitions
│   ├── permissions.ts    # NEW: Permission checking utilities
│   └── keys.ts           # NEW: KV keys for user profiles and audit logs
├── session.ts            # MODIFY: Update User interface
└── http.ts               # MODIFY: Add permission middleware helpers
routes/
└── api/
    └── admin/
        └── users.ts      # NEW: Admin API for user management
```

---

## Task 1: Create `utils/auth/types.ts`

```typescript
/**
 * User roles in the system
 */
export type UserRole = "admin" | "subscriber" | "free";

/**
 * Permissions that can be assigned to roles
 */
export type Permission =
  | "manage:users" // Admin: view/edit/delete any user
  | "manage:subscriptions" // Admin: change user subscription tiers
  | "view:analytics" // Admin: access system analytics
  | "create:unlimited_series" // Subscriber: no limit on series
  | "create:unlimited_books" // Subscriber: no limit on books per series
  | "upload:images" // Subscriber: character image uploads
  | "export:data" // Subscriber: export series data
  | "create:series" // Free: limited series creation
  | "create:books"; // Free: limited books per series

/**
 * Role definitions with their permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "manage:users",
    "manage:subscriptions",
    "view:analytics",
    "create:unlimited_series",
    "create:unlimited_books",
    "upload:images",
    "export:data",
    "create:series",
    "create:books",
  ],
  subscriber: [
    "create:unlimited_series",
    "create:unlimited_books",
    "upload:images",
    "export:data",
    "create:series",
    "create:books",
  ],
  free: ["create:series", "create:books"],
};

/**
 * Tier limits for free users
 */
export const FREE_TIER_LIMITS = {
  maxSeries: 1,
  maxBooksPerSeries: 3,
} as const;

/**
 * Subscription tier types (for future billing integration)
 */
export type SubscriptionTier = "free" | "monthly" | "annual";
```

---

## Task 2: Create `utils/auth/permissions.ts`

```typescript
import type { User } from "@utils/session.ts";
import {
  FREE_TIER_LIMITS,
  type Permission,
  ROLE_PERMISSIONS,
  type UserRole,
} from "./types.ts";

/**
 * Get the effective role for a user (defaults to "free")
 */
export function getUserRole(user: User): UserRole {
  return user.role ?? "free";
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  const role = getUserRole(user);
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: User,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: User): boolean {
  return getUserRole(user) === "admin";
}

/**
 * Check if a user has an active subscription (admin or subscriber)
 */
export function isSubscriber(user: User): boolean {
  const role = getUserRole(user);
  if (role === "admin") return true;
  if (role !== "subscriber") return false;

  // Check if subscription is still valid
  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < Date.now()) {
    return false;
  }
  return true;
}

/**
 * Check if a user can create more series
 */
export function canCreateSeries(
  user: User,
  currentSeriesCount: number,
): boolean {
  if (hasPermission(user, "create:unlimited_series")) {
    return true;
  }
  return currentSeriesCount < FREE_TIER_LIMITS.maxSeries;
}

/**
 * Check if a user can create more books in a series
 */
export function canCreateBook(user: User, currentBookCount: number): boolean {
  if (hasPermission(user, "create:unlimited_books")) {
    return true;
  }
  return currentBookCount < FREE_TIER_LIMITS.maxBooksPerSeries;
}
```

---

## Task 3: Create `utils/auth/keys.ts`

```typescript
/**
 * Key for storing user profile data (includes role and subscription info)
 */
export function userProfileKey(userId: number): Deno.KvKey {
  return ["yawt", "user_profile", userId];
}

/**
 * Prefix for listing all user profiles (admin only)
 */
export function allUserProfilesPrefix(): Deno.KvKey {
  return ["yawt", "user_profile"];
}

/**
 * Key for admin audit log entries
 */
export function auditLogKey(timestamp: number, action: string): Deno.KvKey {
  return ["yawt", "audit_log", timestamp, action];
}

/**
 * Prefix for listing audit logs
 */
export function auditLogPrefix(): Deno.KvKey {
  return ["yawt", "audit_log"];
}
```

---

## Task 4: Modify `utils/session.ts`

Update the `User` interface to include RBAC fields:

```typescript
// Add import at top:
import type { SubscriptionTier, UserRole } from "@utils/auth/types.ts";

// Update User interface:
export interface User {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  // RBAC fields
  role?: UserRole; // User's role (defaults to "free" if undefined)
  subscriptionTier?: SubscriptionTier; // For billing integration
  subscriptionExpiresAt?: number; // Unix timestamp when subscription expires
  createdAt?: number; // When user first signed up
  updatedAt?: number; // Last profile update
}
```

---

## Task 5: Modify `utils/http.ts`

Add permission middleware helpers:

```typescript
// Add imports at top:
import { hasPermission, isAdmin } from "@utils/auth/permissions.ts";
import type { Permission } from "@utils/auth/types.ts";

// Add new functions:

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
    return new Response("Forbidden: insufficient permissions", { status: 403 });
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
    return new Response("Forbidden: admin access required", { status: 403 });
  }

  return userOrRes;
}
```

---

## Task 6: Create `routes/api/admin/users.ts`

```typescript
import { Handlers } from "$fresh/server.ts";
import { kv } from "@utils/kv.ts";
import { badRequest, json, notFound, requireAdmin } from "@utils/http.ts";
import {
  allUserProfilesPrefix,
  auditLogKey,
  userProfileKey,
} from "@utils/auth/keys.ts";
import type { User } from "@utils/session.ts";
import type { UserRole } from "@utils/auth/types.ts";

interface UserProfile {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  role?: UserRole;
  subscriptionTier?: string;
  subscriptionExpiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
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

    return json({ users });
  },

  /**
   * PATCH /api/admin/users - Update a user's role (admin only)
   * Body: { userId: number, role: UserRole }
   */
  async PATCH(req) {
    const adminOrRes = await requireAdmin(req);
    if (adminOrRes instanceof Response) return adminOrRes;
    const admin = adminOrRes;

    let body: { userId?: number; role?: UserRole };
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const { userId, role } = body;

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

    return json({ user: updatedUser });
  },
};
```

---

## Task 7: Enforce Free Tier Limits

### 7a: Series Creation (`routes/series/index.tsx`)

In the POST handler, before creating a new series:

```typescript
import { hasPermission } from "@utils/auth/permissions.ts";
import { FREE_TIER_LIMITS } from "@utils/auth/types.ts";

// Check free tier series limit
if (!hasPermission(user, "create:unlimited_series")) {
  const existingSeries = await getAllSeriesForUser(user.id);
  if (existingSeries.length >= FREE_TIER_LIMITS.maxSeries) {
    return new Response(
      "Series limit reached. Upgrade to create more series.",
      {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }
}
```

### 7b: Book Creation (`routes/api/series/[seriesId]/books.ts`)

In the POST handler, before creating a new book:

```typescript
import { hasPermission } from "@utils/auth/permissions.ts";
import { FREE_TIER_LIMITS } from "@utils/auth/types.ts";

// Check free tier book limit
if (!hasPermission(user, "create:unlimited_books")) {
  let bookCount = 0;
  for await (
    const _ of kv.list({
      prefix: ["yawt", "book", user.id, seriesId],
    })
  ) {
    bookCount++;
  }

  if (bookCount >= FREE_TIER_LIMITS.maxBooksPerSeries) {
    return new Response("Book limit reached. Upgrade to create more books.", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
```

---

## Task 8: Initialize User Profile on Sign-in

In `routes/auth/callback.ts`, after successful OAuth:

```typescript
import { kv } from "@utils/kv.ts";
import { userProfileKey } from "@utils/auth/keys.ts";

const now = Date.now();
const existingProfile = await kv.get(userProfileKey(user.id));

if (!existingProfile.value) {
  // First sign-in - create profile with free tier
  await kv.set(userProfileKey(user.id), {
    id: user.id,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    role: "free",
    createdAt: now,
    updatedAt: now,
  });
} else {
  // Update existing profile
  await kv.set(userProfileKey(user.id), {
    ...existingProfile.value,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    updatedAt: now,
  });
}
```

---

## Testing Checklist

- [ ] New users default to "free" role
- [ ] Free users cannot create more than 1 series
- [ ] Free users cannot create more than 3 books per series
- [ ] Subscribers have no limits
- [ ] Admins can access `/api/admin/users`
- [ ] Admins can change user roles via PATCH
- [ ] Admins cannot demote themselves
- [ ] Role changes are logged in audit log
- [ ] Non-admins get 403 on admin endpoints

---

## Future Enhancements (Out of Scope)

- Admin dashboard UI (`/admin/users`)
- Stripe/payment integration
- Subscription expiration handling
- Email notifications
- Upgrade prompts in UI
