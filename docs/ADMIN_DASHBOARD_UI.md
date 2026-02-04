# Admin Dashboard UI Mockup

## User Menu (For Admin Users)

When an admin user clicks on their avatar in the top-right corner, they see:

```
┌─────────────────────────────────┐
│  John Doe                       │
├─────────────────────────────────┤
│  🎨 Theme Selector              │
├─────────────────────────────────┤
│  👑 Admin Dashboard             │  ← NEW: Only visible to admins
├─────────────────────────────────┤
│  🚪 Sign out                    │
└─────────────────────────────────┘
```

## Admin Dashboard Page (/admin)

### Header Section
```
┌────────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                                │
│  Manage users, roles, and application access.                   │
└────────────────────────────────────────────────────────────────┘
```

### User Management Table
```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  User Management                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐   │
│  │ User                 │ Email                  │ Role        │ Created    │ Status  │ Actions │
│  ├──────────────────────────────────────────────────────────────────────────────────────┤   │
│  │ 🖼️ John Doe         │ johndoe@github.com     │ [Admin ▼]   │ Jan 1 2024 │ ✅ Active │ [Block] │
│  │   @johndoe          │                        │             │            │         │         │
│  ├──────────────────────────────────────────────────────────────────────────────────────┤   │
│  │ 🖼️ Jane Smith       │ janesmith@github.com   │ [Sub ▼]     │ Jan 2 2024 │ ✅ Active │ [Block] │
│  │   @janesmith        │                        │             │            │         │         │
│  ├──────────────────────────────────────────────────────────────────────────────────────┤   │
│  │ 🖼️ Bob Johnson      │ bobjohnson@github.com  │ [Free ▼]    │ Jan 3 2024 │ 🚫 Blocked│[Unblock]│
│  │   @bobjohnson       │                        │             │            │         │         │
│  └──────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                               │
│  Total users: 3                                                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### User Avatar
- Shows the user's GitHub avatar
- Rounded corners (mask-squircle)
- 48x48 pixels

### Username Display
- Bold name on first line (if available)
- Gray @username on second line

### Email
- Derived from GitHub username + @github.com
- Small, gray text

### Role Dropdown
- Three options: Admin, Subscriber, Free
- Updates immediately on selection
- Disabled while updating (shows spinner)
- Admin users cannot change their own role

### Created Date
- Formatted as "MMM DD YYYY" (e.g., "Jan 15 2024")
- Shows "N/A" if date not available

### Status Badge
- Green "Active" badge for non-blocked users
- Red "Blocked" badge for blocked users

### Block/Unblock Button
- Shows "Block" for active users (red button)
- Shows "Unblock" for blocked users (green button)
- Disabled while updating (shows spinner)
- Admin users cannot block themselves

## User Interactions

### Changing User Role
1. Admin clicks on role dropdown
2. Selects new role (Admin/Subscriber/Free)
3. Dropdown shows loading spinner
4. Role updates in database
5. Table refreshes with new role
6. Audit log records the change

### Blocking a User
1. Admin clicks "Block" button
2. Button shows loading spinner
3. User is marked as blocked in database
4. Table refreshes showing "Blocked" status
5. Button changes to "Unblock"
6. Audit log records the action
7. User receives 403 error on next request

### Unblocking a User
1. Admin clicks "Unblock" button
2. Button shows loading spinner
3. User block is removed from database
4. Table refreshes showing "Active" status
5. Button changes to "Block"
6. Audit log records the action
7. User can access the application again

## Error Handling

### Loading State
- Shows a centered spinner while fetching users
- "Loading..." text for accessibility

### Error State
- Red alert box at top of table
- Error icon and message
- Does not prevent viewing existing data
- Example: "Failed to load users: Network error"

### Update Errors
- Shows error in alert box
- Previous state is maintained
- Example: "Cannot change your own admin role"

## Responsive Design

The table uses daisyUI's responsive table classes:
- On desktop: Full table with all columns visible
- On tablet: May scroll horizontally if needed
- On mobile: Table becomes scrollable

## Color Scheme (daisyUI theme: yawt)

- Primary actions: btn-primary
- Destructive actions (Block): btn-error
- Success actions (Unblock): btn-success
- Cards: bg-base-100 with shadow-sm
- Text: Default base colors with opacity for secondary text
