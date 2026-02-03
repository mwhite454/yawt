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
