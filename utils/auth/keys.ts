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
