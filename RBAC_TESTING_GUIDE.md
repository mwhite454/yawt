# RBAC Testing Guide

This document describes how to test the newly implemented Role-Based Access
Control (RBAC) system.

## Implementation Summary

The RBAC system has been successfully implemented with the following components:

### New Files Created

1. **`utils/auth/types.ts`**
   - Defines `UserRole` type: "admin" | "subscriber" | "free"
   - Defines `Permission` type with 9 different permissions
   - Maps roles to their permissions via `ROLE_PERMISSIONS`
   - Defines `FREE_TIER_LIMITS`: 1 series, 3 books per series
   - Defines `SubscriptionTier` type for future billing

2. **`utils/auth/permissions.ts`**
   - `getUserRole()`: Get user's role (defaults to "free")
   - `hasPermission()`: Check if user has a specific permission
   - `hasAnyPermission()`: Check if user has any of specified permissions
   - `hasAllPermissions()`: Check if user has all specified permissions
   - `isAdmin()`: Check if user is an admin
   - `isSubscriber()`: Check if user has active subscription
   - `canCreateSeries()`: Check series creation limit
   - `canCreateBook()`: Check book creation limit

3. **`utils/auth/keys.ts`**
   - `userProfileKey()`: KV key for user profiles
   - `allUserProfilesPrefix()`: Prefix for listing all users
   - `auditLogKey()`: Key for audit log entries
   - `auditLogPrefix()`: Prefix for listing audit logs

4. **`routes/api/admin/users.ts`**
   - GET `/api/admin/users`: List all users (admin only)
   - PATCH `/api/admin/users`: Update user role (admin only)
   - Includes audit logging for role changes
   - Prevents admins from demoting themselves

### Modified Files

1. **`utils/session.ts`**
   - Added RBAC fields to User interface:
     - `role?: UserRole`
     - `subscriptionTier?: SubscriptionTier`
     - `subscriptionExpiresAt?: number`
     - `createdAt?: number`
     - `updatedAt?: number`

2. **`utils/http.ts`**
   - Added `requirePermission()`: Middleware to check permissions
   - Added `requireAdmin()`: Middleware to require admin role

3. **`routes/auth/callback.ts`**
   - Creates user profile on first sign-in (admin if first user, free otherwise)
   - Updates profile on subsequent sign-ins
   - Automatically grants admin role if user is the only user in the system
   - Loads role and subscription info into session

4. **`routes/series/index.tsx`** and **`routes/api/series.ts`**
   - Enforces free tier limit: max 1 series
   - Returns 403 with message if limit exceeded
   - Bypassed for users with "create:unlimited_series" permission

5. **`routes/api/series/[seriesId]/books.ts`**
   - Enforces free tier limit: max 3 books per series
   - Returns 403 with message if limit exceeded
   - Bypassed for users with "create:unlimited_books" permission

## Testing Checklist

### 1. User Profile Initialization ✓ (Auto-tested on sign-in)

- [ ] First user in system gets "admin" role automatically
- [ ] Subsequent users get "free" role automatically
- [ ] Sole user (only user in system) is auto-promoted to "admin" on login
- [ ] User profile is created in KV at `["yawt", "user_profile", userId]`
- [ ] Profile includes: id, login, name, avatar_url, role, createdAt, updatedAt
- [ ] Subsequent sign-ins update profile but preserve role (unless sole user)

**How to test:**

1. Sign in with a new GitHub account as the first user
2. Check KV database for user profile entry
3. Verify role is set to "admin" (first user)
4. Add a second user (sign in with different account)
5. Verify second user has role "free"
6. Remove the first user's profile from KV
7. Sign in again as the second user
8. Verify role is now "admin" (sole user auto-promotion)

### 2. Free Tier Series Limit ✓ (Enforced in code)

- [ ] Free users can create 1 series
- [ ] Creating a 2nd series returns 403 error
- [ ] Error message: "Series limit reached. Upgrade to create more series."
- [ ] Admins can create unlimited series
- [ ] Subscribers can create unlimited series

**How to test:**

1. As a free user, create 1 series via UI or API
2. Try to create a 2nd series
3. Verify 403 response with limit message
4. Promote user to subscriber or admin
5. Verify unlimited series creation works

### 3. Free Tier Books Limit ✓ (Enforced in code)

- [ ] Free users can create 3 books per series
- [ ] Creating a 4th book returns 403 error
- [ ] Error message: "Book limit reached. Upgrade to create more books."
- [ ] Admins can create unlimited books
- [ ] Subscribers can create unlimited books

**How to test:**

1. As a free user, create a series
2. Create 3 books in that series
3. Try to create a 4th book
4. Verify 403 response with limit message
5. Promote user to subscriber
6. Verify unlimited book creation works

### 4. Admin User Management API ✓ (Implemented)

**GET /api/admin/users**

- [ ] Returns 403 for non-admin users
- [ ] Returns list of all users for admin
- [ ] Users sorted by updatedAt (newest first)

**PATCH /api/admin/users**

- [ ] Returns 403 for non-admin users
- [ ] Requires userId (number) and role (admin|subscriber|free)
- [ ] Returns 400 for invalid inputs
- [ ] Returns 404 if user not found
- [ ] Prevents admin from demoting themselves
- [ ] Updates user role successfully
- [ ] Creates audit log entry
- [ ] Returns updated user profile

**How to test:**

1. Create a test admin user by manually setting role in KV
2. Make GET request to `/api/admin/users` as admin
3. Verify user list is returned
4. Make PATCH request to change a user's role
5. Verify role is updated in KV
6. Verify audit log entry is created
7. Try to demote yourself - should fail with 400
8. Make requests as non-admin - should fail with 403

### 5. Permission System ✓ (Implemented)

Test the permission utility functions:

- [ ] `hasPermission()` correctly checks role permissions
- [ ] Free users only have "create:series" and "create:books"
- [ ] Subscribers have all permissions except admin permissions
- [ ] Admins have all permissions
- [ ] Undefined role defaults to "free"

**How to test:** Create a test script or use Deno REPL to verify permission
functions.

### 6. Subscription Expiration (Future feature)

- [ ] Expired subscribers revert to free tier limits
- [ ] `isSubscriber()` checks expiration timestamp
- [ ] Expired users can't create beyond free limits

**How to test:**

1. Set subscriptionExpiresAt to past timestamp
2. Verify user is treated as free tier
3. Verify limits are enforced

## Manual Testing Steps

### Setup

1. Ensure you have a GitHub OAuth app configured
2. Start the development server: `deno task start`
3. Have multiple GitHub accounts ready (or use KV directly)

### Test 1: New User Sign-in

```bash
# Start server
deno task start

# Sign in with new GitHub account
# Open browser to http://localhost:8000
# Click sign in
# Check terminal logs for user creation
```

### Test 2: Series Limit (Free User)

```bash
# Sign in as free user
# Navigate to /series
# Create 1st series - should succeed
# Try to create 2nd series - should fail with 403
```

### Test 3: Book Limit (Free User)

```bash
# As free user with 1 series
# Create books: 1st, 2nd, 3rd - all succeed
# Try to create 4th book - should fail with 403
```

### Test 4: Admin API (As Admin)

```bash
# Set user role to admin in KV database
curl -X GET http://localhost:8000/api/admin/users \
  -H "Cookie: <session-cookie>"

# Should return list of users

curl -X PATCH http://localhost:8000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"userId": 123456, "role": "subscriber"}'

# Should update user role
```

### Test 5: Role Changes

```bash
# Using Deno KV CLI or custom script
# Change a user's role from free to subscriber
# Sign in as that user
# Verify unlimited series/books creation works
```

## KV Database Inspection

To manually inspect or modify user profiles:

```javascript
// In Deno REPL or script
import { kv } from "./utils/kv.ts";

// Get user profile
const userId = 123456; // Your GitHub user ID
const profile = await kv.get(["yawt", "user_profile", userId]);
console.log(profile.value);

// Set user to admin
await kv.set(["yawt", "user_profile", userId], {
  ...profile.value,
  role: "admin",
  updatedAt: Date.now(),
});

// List all users
for await (const entry of kv.list({ prefix: ["yawt", "user_profile"] })) {
  console.log(entry.key, entry.value);
}
```

## Expected Behavior Summary

| User Role  | Max Series | Max Books/Series | Can Manage Users | Can Upload Images |
| ---------- | ---------- | ---------------- | ---------------- | ----------------- |
| free       | 1          | 3                | ❌               | ❌                |
| subscriber | Unlimited  | Unlimited        | ❌               | ✅                |
| admin      | Unlimited  | Unlimited        | ✅               | ✅                |

## Future Enhancements (Not Implemented)

- [ ] Admin dashboard UI
- [ ] Payment integration (Stripe)
- [ ] Subscription expiration reminders
- [ ] Email notifications
- [ ] Upgrade prompts in UI
- [ ] Analytics dashboard for admins

## Troubleshooting

**Issue: User role not being set**

- Check auth callback logs
- Verify KV database connection
- Check user profile KV entry

**Issue: Limits not enforced**

- Verify hasPermission() is being called
- Check user.role value in session
- Verify FREE_TIER_LIMITS constant

**Issue: Admin API returns 403**

- Check user's role in KV database
- Verify session cookie is valid
- Check requireAdmin() middleware

## Security Notes

1. ✅ Admins cannot demote themselves
2. ✅ Non-admins cannot access admin endpoints
3. ✅ All role changes are logged in audit log
4. ✅ User profiles are separate from session data
5. ✅ Permission checks use allowlist (ROLE_PERMISSIONS)

## Conclusion

The RBAC system has been fully implemented according to specifications. All core
functionality is in place:

- ✅ Role-based permissions system
- ✅ Free tier limits enforcement
- ✅ Admin user management API
- ✅ User profile initialization
- ✅ Audit logging
- ✅ Middleware for permission checking

The system is ready for testing and integration with a billing system in the
future.
