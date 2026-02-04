# Admin Dashboard Feature

## Overview

This document describes the admin dashboard feature that allows administrators to view and manage users in the YAWT application.

## Features

### 1. First User Auto-Admin Assignment

The first user to register in the application is automatically assigned the `admin` role. This ensures there is always at least one administrator who can manage other users.

**Implementation:** Modified `routes/auth/callback.ts` to check if any user profiles exist before creating a new one. If no profiles exist, the new user is assigned the `admin` role.

### 2. Admin Dashboard UI

Located at `/admin`, the admin dashboard provides a comprehensive interface for user management.

**Features:**
- View all users in a table format
- Display user information:
  - Avatar and name
  - Username (GitHub login)
  - Email (derived from GitHub username)
  - Role (admin, subscriber, free)
  - Created date
  - Status (Active/Blocked)
- Real-time role updates via dropdown
- Block/unblock users with a single click
- Loading states and error handling
- User count display

**Implementation:** 
- Route: `routes/admin/index.tsx` 
- Island: `islands/AdminDashboard.tsx`

### 3. Admin Menu Link

Administrators see an "Admin Dashboard" link in the user menu dropdown. This link is only visible to users with the `admin` role.

**Implementation:** Modified `components/UserMenu.tsx` to conditionally show the admin link based on the user's role.

### 4. User Blocking

Administrators can block users from accessing the application. Blocked users receive a 403 Forbidden error when attempting to access any protected resource.

**Implementation:**
- Added `blocked` field to the User and UserProfile interfaces
- Modified `utils/http.ts` `requireUser()` function to check if user is blocked
- Added PUT endpoint to `routes/api/admin/users.ts` to toggle block status

### 5. API Endpoints

#### GET `/api/admin/users`
Lists all users in the system. Admin only.

**Response:**
```json
{
  "users": [
    {
      "id": 12345,
      "login": "octocat",
      "name": "The Octocat",
      "avatar_url": "https://...",
      "role": "admin",
      "createdAt": 1234567890,
      "updatedAt": 1234567890,
      "blocked": false
    }
  ]
}
```

#### PATCH `/api/admin/users`
Updates a user's role. Admin only.

**Request:**
```json
{
  "userId": 12345,
  "role": "subscriber"
}
```

**Response:**
```json
{
  "user": {
    "id": 12345,
    "login": "octocat",
    "role": "subscriber",
    ...
  }
}
```

**Protections:**
- Admins cannot demote themselves
- Role changes are logged in the audit log

#### PUT `/api/admin/users`
Blocks or unblocks a user. Admin only.

**Request:**
```json
{
  "userId": 12345,
  "blocked": true
}
```

**Response:**
```json
{
  "user": {
    "id": 12345,
    "login": "octocat",
    "blocked": true,
    ...
  }
}
```

**Protections:**
- Admins cannot block themselves
- Block actions are logged in the audit log

## Data Model Changes

### User Interface (`utils/session.ts`)
Added `blocked?: boolean` field to track user block status.

### UserProfile Interface
Added `blocked?: boolean` field to:
- `routes/auth/callback.ts`
- `routes/api/admin/users.ts`

## Security

1. **Admin-Only Access:** All admin endpoints require the `admin` role via `requireAdmin()` middleware
2. **Self-Protection:** Admins cannot:
   - Change their own role (prevent accidental demotion)
   - Block themselves (prevent self-lockout)
3. **Blocked User Check:** All protected routes check if user is blocked via `requireUser()`
4. **Audit Logging:** All admin actions (role changes, blocking) are logged with:
   - Timestamp
   - Admin ID and username
   - Target user ID
   - Action details

## Testing Checklist

- [ ] First user to sign in is automatically assigned admin role
- [ ] Admin sees "Admin Dashboard" link in user menu
- [ ] Non-admin users do not see admin dashboard link
- [ ] Admin dashboard loads and displays all users
- [ ] Admin can change user roles via dropdown
- [ ] Admin cannot change their own role
- [ ] Admin can block/unblock users
- [ ] Admin cannot block themselves
- [ ] Blocked users receive 403 when accessing protected resources
- [ ] All admin actions are logged in audit log

## Files Modified

1. `utils/session.ts` - Added `blocked` field to User interface
2. `utils/http.ts` - Added blocked check to `requireUser()`
3. `routes/auth/callback.ts` - First user auto-admin and blocked field
4. `routes/api/admin/users.ts` - Added PUT endpoint for blocking users
5. `components/UserMenu.tsx` - Added admin dashboard link for admins

## Files Created

1. `routes/admin/index.tsx` - Admin dashboard page
2. `islands/AdminDashboard.tsx` - Interactive admin dashboard component

## Usage

### For Administrators

1. Sign in to YAWT
2. Click on your avatar in the top-right corner
3. Click "Admin Dashboard" in the dropdown menu
4. View and manage users:
   - Change user roles using the dropdown
   - Block/unblock users using the action button

### For the First User

The first user to register will automatically have admin privileges and can access the admin dashboard immediately.

## Future Enhancements

- Search and filter users
- Bulk actions (e.g., bulk role changes)
- User activity logs
- Export user list
- Email notifications for admin actions
- User invitation system
