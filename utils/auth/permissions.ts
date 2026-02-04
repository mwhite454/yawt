import type { User } from "@utils/session.ts";
import {
  FREE_TIER_LIMITS,
  type Permission,
  ROLE_PERMISSIONS,
  type UserRole,
} from "./types.ts";

/**
 * Get the effective role for a user (defaults to "free")
 * Expired subscribers are downgraded to "free"
 */
export function getUserRole(user: User): UserRole {
  const role = user.role ?? "free";

  // If subscriber, check if subscription has expired
  if (role === "subscriber") {
    if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < Date.now()) {
      return "free";
    }
  }

  return role;
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
