# Copilot Instructions for YAWT

## Project Overview

YAWT (Yet Another Writing Tool) is a modern writing tool designed for authors to
manage series, books, scenes, characters, locations, and timelines. It uses a
**dual-stack** architecture: a Deno + Fresh backend for API, auth, and RBAC, plus
a React + Vite SPA (`client/`) as the primary writing interface.

## Technology Stack

### Backend (Deno / Fresh)

- **Runtime**: Deno 2.6.4+
- **Framework**: Fresh 1.6.1 (file-based routing with Preact)
- **Language**: TypeScript 5.9.2
- **UI Library**: Preact 10.19.2 (server-rendered + interactive islands)
- **Styling**: Tailwind CSS 3 + daisyUI 4 (yawt theme)
- **Authentication**: GitHub OAuth2 via @deno/kv-oauth
- **Database**: Deno KV (built-in key-value database)
- **RBAC**: Role-based access control (`admin` / `subscriber` / `free`) via `utils/auth/`
- **Image Storage**: Cloudflare R2 (optional, for character images)

### Frontend (`client/` — React SPA served at `/client`)

- **Build tool**: Vite 8
- **Framework**: React 19
- **Language**: TypeScript 5.9.3
- **Routing**: React Router 7 (basename `/client`)
- **Data fetching**: TanStack Query 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style, zinc base, CSS variables)
- **Icons**: Lucide React
- **Drag & drop**: dnd-kit
- **Dev port**: 5173 (proxies `/api` and `/auth` to Fresh on port 8000)
- **Production output**: `static/client/` (served by Fresh catchall `routes/[...path].tsx`)

## Development Workflow

### Setup

1. Copy `.env.example` to `.env` and configure GitHub OAuth credentials
2. See `SETUP.md` for detailed OAuth setup instructions

### Commands

- **Full-stack dev** (recommended): `deno task start:full`
  - Runs Tailwind watch + Fresh (port 8000) + Vite dev server (port 5173) concurrently
  - Access the React SPA at `http://localhost:5173` during development
- **Backend only**: `deno task start`
  - Runs Tailwind in watch mode and Fresh with hot reload at `http://localhost:8000`
- **React client only**: `deno task client:dev` (requires Fresh already running)
- **Build React client**: `deno task client:build`
  - Outputs to `static/client/` (required before `deno task preview`)
- **Build CSS**: `deno task build`
  - Builds Tailwind CSS to `static/styles.css` (minified) + Fresh build
- **Type check, lint, and format (backend)**: `deno task check`
  - Runs `deno fmt --check`, `deno lint`, and type checks all Deno TypeScript files
- **Lint React client**: `cd client && npm run lint`
- **Production server**: `deno task client:build && deno task preview`

### Testing

- There are currently no automated tests in this repository
- Manual testing is done by running the development server and using the API
  endpoints

## Code Style and Conventions

### General

- Use TypeScript for all new code
- Follow Deno's recommended style (enforced by `deno fmt` and `deno lint`)
- Use the path aliases defined in `deno.json`:
  - `@components/` → `./components/`
  - `@islands/` → `./islands/`
  - `@utils/` → `./utils/`
  - `$fresh/` → Fresh framework
  - `$std/` → Deno standard library

### File Organization

**Deno / Fresh (backend):**

- **routes/**: File-based routing (Fresh convention)
  - `routes/_app.tsx`: Root application component
  - `routes/index.tsx`: Homepage
  - `routes/[...path].tsx`: Catchall — serves the built React SPA
  - `routes/auth/`: OAuth authentication routes
  - `routes/admin/`: Admin dashboard (RBAC-protected)
  - `routes/api/`: REST API endpoints
- **islands/**: Interactive Preact components (hydrated on client)
- **components/**: Shared server-side Preact components
- **utils/**: Utility functions and shared logic
  - `utils/auth/`: RBAC types (`types.ts`), permissions (`permissions.ts`)
  - `utils/http.ts`: HTTP helpers including `requireUser`, `requireAdmin`, `requirePermission`
  - `utils/story/`: Data types, KV keys, frontmatter parsing
- **static/**: Static assets (served from root `/`)
  - `static/client/`: Built React SPA output (generated, do not edit manually)

**React SPA (`client/`):**

- `client/src/api/`: Fetch helpers for each resource
- `client/src/components/`: React UI components
  - `client/src/components/ui/`: shadcn/ui generated components
  - `client/src/components/layout/`: AppShell, Navbar
- `client/src/contexts/`: React context providers
- `client/src/hooks/`: TanStack Query hooks
- `client/src/pages/`: Page-level components
- `client/src/types/`: TypeScript type definitions (`story.ts`, `user.ts`)
- `client/components.json`: shadcn/ui configuration
- `client/vite.config.ts`: Vite config (builds to `../static/client/`)

### API Routes

- All API routes follow Fresh's `Handlers` pattern
- Use `requireUser()` from `@utils/http.ts` to enforce authentication
- Return responses using utility functions from `@utils/http.ts`:
  - `json()`: JSON responses
  - `badRequest()`: 400 errors
  - `unauthorized()`: 401 errors
  - `notFound()`: 404 errors
  - `serverError()`: 500 errors
- Use `readJson()` to safely parse request bodies

Example pattern:

```typescript
export const handler: Handlers = {
  async GET(req) {
    const userOrRes = await requireUser(req);
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    // ... handler logic

    return json({ data }, { status: 200 });
  },
};
```

### Deno KV Usage

- Import KV instance from `@utils/kv.ts`
- Use consistent key structure: `["yawt", resourceType, userId, ...ids]`
- Key helper functions are in `@utils/story/keys.ts`
- Common patterns:
  - `kv.get()`: Retrieve single item
  - `kv.set()`: Store item
  - `kv.delete()`: Remove item
  - `kv.list()`: Query with prefix

### Data Types

- Type definitions are in `@utils/story/types.ts`
- All entities have:
  - `id`: UUID (string)
  - `userId`: GitHub user ID (number)
  - `createdAt`: Unix timestamp (number)
  - `updatedAt`: Unix timestamp (number)
- Use `crypto.randomUUID()` for generating IDs
- Use `Date.now()` for timestamps

### Authentication

- GitHub OAuth2 flow is handled by `@deno/kv-oauth`
- Session management in `@utils/session.ts` and `@utils/oauth.ts`
- User data stored in KV under `["users", sessionId]`
- All API routes require authentication

### Scenes and Frontmatter

- Scenes support YAML frontmatter in the `text` field
- Frontmatter is parsed to extract metadata like:
  - `title`: Scene title
  - `startDate`/`endDate`: For timeline events
  - `timelines`: Array of timeline IDs
  - `tags`: Array of tags
- Frontmatter parsing logic is in `@utils/story/frontmatter.ts`

### Styling

**Backend (Fresh/Preact components):**

- Use Tailwind CSS 3 utility classes
- daisyUI 4 component classes are available (theme: "yawt")
- Global styles are in `styles/tailwind.css`
- Built CSS output goes to `static/styles.css`

**Frontend (React/shadcn components):**

- Use Tailwind CSS 4 utility classes
- shadcn/ui components live in `client/src/components/ui/`
- Use `cn()` from `client/src/lib/utils.ts` for conditional class merging
- CSS variables are defined in `client/src/index.css`
- Do NOT use daisyUI classes in the React client

## Architecture Notes

### Dual-stack design

The project has two distinct codebases sharing the same repo:

1. **Fresh backend**: handles API, auth, RBAC, KV storage, and some SSR pages
2. **React SPA** (`client/`): the primary writing interface, built to `static/client/`
   and served by `routes/[...path].tsx` in production

During development, Vite runs on port 5173 and proxies `/api` and `/auth` to
Fresh on port 8000. In production, everything is served from the single Fresh
server on port 8000.

### Fresh Framework

- Fresh uses an island architecture: most components render on the server, only
  "islands" are interactive
- Routes are defined by file structure in the `routes/` directory
- Islands must be in the `islands/` directory and are automatically hydrated
- No build step required for the backend during development
- Server-side rendering provides fast initial page loads

### RBAC

- Three roles: `admin`, `subscriber`, `free` (defined in `utils/auth/types.ts`)
- Permission checking: `hasPermission(user, permission)`, `isAdmin(user)` in `utils/auth/permissions.ts`
- HTTP guards: `requireUser(req)`, `requireAdmin(req)`, `requirePermission(req, perm)` in `utils/http.ts`
- Admin management API: `routes/api/admin/users.ts`
- Admin UI: `routes/admin/index.tsx` (Fresh) + `islands/AdminDashboard.tsx`
- React client reads `user.role` from `/api/me` to conditionally show admin UI

### Data Model

The application uses a hierarchical data structure:

```
User
└── Series (multiple)
    ├── Books (multiple, rank-ordered)
    │   └── Scenes (multiple, rank-ordered, support YAML frontmatter)
    ├── Characters (multiple, optional image via R2)
    ├── Locations (multiple, with optional coords/tags)
    └── Timelines (multiple)
        └── Events (derived from dated scenes)
```

### Rank Ordering

- Books and scenes use a rank-based ordering system
- When reordering, items are inserted between two other items
- Rank calculation uses fractional ranks between adjacent items

## Important Context

### Environment Variables

- `OAUTH_CLIENT_ID`: Required for OAuth
- `OAUTH_CLIENT_SECRET`: Required for OAuth
- `OAUTH_REDIRECT_URI`: OAuth callback URL (default:
  `http://localhost:8000/auth/callback`)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`:
  Optional, for R2 image uploads
- `R2_PUBLIC_URL`: Optional, base URL for serving R2 images

### Deno-Specific Features

- Uses Deno's built-in KV database (requires `--unstable-kv` flag)
- No `node_modules` - dependencies are imported from URLs
- `deno.json` configures imports, tasks, and compiler options
- `fresh.gen.ts` is auto-generated (Fresh manifest)

### Security

- Never commit `.env` files
- All API endpoints require authentication
- Session cookies are HTTP-only
- Use separate OAuth apps for dev/staging/prod

## Boundaries and Restrictions

**Files/Directories to NEVER Edit:**

- `.env` - Contains sensitive environment variables
- `fresh.gen.ts` - Auto-generated Fresh manifest
- `.github/workflows/` - CI/CD workflows (requires specific approval)
- `.git/` - Git internals

**Files to Edit Only When Adding/Changing Env Vars:**

- `.env.example` - Template for environment variables; update when introducing
  or changing env vars so others can configure them

**Breaking Changes to Avoid:**

- Do not change the Deno KV key structure without migration strategy
- Do not modify OAuth flow without thorough testing
- Do not change API endpoint URLs or response formats without versioning
- Do not modify the rank ordering system for books/scenes without careful
  consideration

## Common Tasks

### Adding a New API Endpoint

1. Create a file in `routes/api/` following the URL structure
2. Export a `handler: Handlers` object with HTTP methods
3. Use `requireUser()` to enforce authentication
4. Use KV helpers for data access
5. Return responses using `@utils/http.ts` utilities

### Adding a New React Page

1. Create a file in `client/src/pages/`
2. Export a React component
3. Add a `<Route>` in `client/src/App.tsx`
4. Add an API fetch helper in `client/src/api/` if needed
5. Add a TanStack Query hook in `client/src/hooks/` if needed

### Adding a New shadcn/ui Component

Use the shadcn CLI from inside the `client/` directory:

```bash
cd client && npx shadcn@latest add <component-name>
```

Components are added to `client/src/components/ui/`.

### Adding a New Interactive Island (Fresh)

1. Create a file in `islands/`
2. Export a Preact component
3. Import and use in routes or other Fresh components
4. Component will be automatically hydrated on the client

### Adding a New Type

- **Backend data types**: `@utils/story/types.ts` + `@utils/story/keys.ts`
- **React client types**: `client/src/types/story.ts` or `client/src/types/user.ts`

### Modifying Styles

**Fresh/Preact components:** Edit `styles/tailwind.css` or use Tailwind + daisyUI
classes. Run `deno task start` to rebuild automatically.

**React client:** Use Tailwind 4 utility classes and/or shadcn/ui components.
Vite handles CSS automatically during `deno task client:dev`.

## Verification and Testing

### Before Submitting Changes

1. **Backend type check and lint**: Always run `deno task check`
   - Runs `deno fmt --check`, `deno lint`, and type checks all Deno TypeScript files
   - Fix any errors before committing

2. **React client lint**: Run `cd client && npm run lint`

3. **Manual Testing**: Since there are no automated tests:
   - Start the full stack with `deno task start:full`
   - Test your changes through the UI at `http://localhost:5173`
   - Verify OAuth flow if authentication code was modified
   - Test API endpoints with curl or browser dev tools

4. **Build Verification**: Run `deno task client:build && deno task build` to
   ensure both the React SPA and CSS build successfully

### Testing API Changes

Use curl to test API endpoints. Example workflow:

```bash
# 1. In one terminal, start the dev server and leave it running
deno task start

# 2. In your browser, sign in at http://localhost:8000 to get a session cookie

# 3. In another terminal, test the API with your session cookie
curl -v http://localhost:8000/api/me \
  -H "Cookie: session=YOUR_SESSION_COOKIE"

# 4. Test CRUD operations
curl -X POST http://localhost:8000/api/series \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{"title": "Test Series"}'
```

Note: API calls always go to port 8000 regardless of dev mode.

## Quick Reference

### Most Common Tasks

1. **Add new API endpoint**: Create file in `routes/api/`, use `requireUser()`,
   return with `json()`
2. **Add new React page**: Create in `client/src/pages/`, add route in `App.tsx`
3. **Add interactive Preact island**: Create in `islands/`, export Preact component
4. **Add shadcn/ui component**: `cd client && npx shadcn@latest add <name>`
5. **Add new backend data type**: Update `@utils/story/types.ts` and `@utils/story/keys.ts`
6. **Add new client-side type**: Update `client/src/types/story.ts` or `user.ts`
7. **Fix backend styling**: Edit component's Tailwind + daisyUI classes or `styles/tailwind.css`
8. **Fix React styling**: Edit Tailwind 4 classes or `client/src/index.css`
9. **Update Deno dependencies**: Modify `imports` in `deno.json`
10. **Update npm dependencies**: `cd client && npm install <pkg>`

### Key Files Reference

**Backend:**

- **`deno.json`** - Tasks, imports, compiler options
- **`@utils/http.ts`** - HTTP helpers (requireUser, requireAdmin, json, error responses)
- **`@utils/kv.ts`** - Deno KV instance
- **`@utils/story/types.ts`** - Backend data type definitions
- **`@utils/story/keys.ts`** - KV key helpers
- **`@utils/auth/types.ts`** - RBAC types (UserRole, Permission)
- **`@utils/auth/permissions.ts`** - RBAC helpers (isAdmin, hasPermission)
- **`@utils/oauth.ts`** - OAuth configuration
- **`@utils/session.ts`** - Session management + User interface

**React client:**

- **`client/src/App.tsx`** - React Router setup and route definitions
- **`client/src/api/`** - Resource-specific fetch helpers
- **`client/src/hooks/`** - TanStack Query hooks
- **`client/src/types/`** - Client-side TypeScript types
- **`client/src/lib/utils.ts`** - `cn()` utility for Tailwind class merging
- **`client/vite.config.ts`** - Vite config and dev proxy
- **`client/components.json`** - shadcn/ui configuration
