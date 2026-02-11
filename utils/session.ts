import { getSessionId } from "./oauth.ts";
import { kv } from "./kv.ts";
import type { DaisyUITheme } from "./themes.ts";

// Re-export themes from separate file (safe for client-side use)
export { DAISYUI_THEMES, type DaisyUITheme } from "./themes.ts";

// Import RBAC types
import type { SubscriptionTier, UserRole } from "@utils/auth/types.ts";

export interface User {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  email?: string;
  defaultTheme?: DaisyUITheme;
  // RBAC fields
  role?: UserRole; // User's role (defaults to "free" if undefined)
  subscriptionTier?: SubscriptionTier; // For billing integration
  subscriptionExpiresAt?: number; // Unix timestamp when subscription expires
  createdAt?: number; // When user first signed up
  updatedAt?: number; // Last profile update
  blocked?: boolean; // Whether user is blocked from using the application
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
