export type UserRole = "admin" | "subscriber" | "free";
export type SubscriptionTier = "free" | "basic" | "pro";

export interface User {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url: string;
  defaultTheme?: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  subscriptionExpiresAt?: number;
  createdAt?: number;
  blocked?: boolean;
}
