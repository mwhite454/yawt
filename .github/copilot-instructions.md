# Copilot Instructions for YAWT

## Project Overview

YAWT (Yet Another Writing Tool) is a modern writing tool designed for authors to manage series, books, scenes, characters, locations, and timelines. It's built with Deno and the Fresh web framework, providing a server-side rendered web application with an island architecture for interactive components.

## Technology Stack

- **Runtime**: Deno 2.6.4+
- **Framework**: Fresh 1.6.1 (file-based routing with Preact)
- **Language**: TypeScript 5.9.2
- **UI Library**: Preact 10.19.2 (lightweight React alternative)
- **Styling**: Tailwind CSS + daisyUI (yawt theme)
- **Authentication**: GitHub OAuth2 via @deno/kv-oauth
- **Database**: Deno KV (built-in key-value database)
- **Image Storage**: Cloudflare R2 (optional, for character images)

## Development Workflow

### Setup

1. Copy `.env.example` to `.env` and configure GitHub OAuth credentials
2. See `SETUP.md` for detailed OAuth setup instructions

### Commands

- **Start development server**: `deno task start`
  - Runs Tailwind in watch mode and Fresh with hot reload
  - Server runs at `http://localhost:8000`
- **Build CSS**: `deno task build`
  - Builds Tailwind CSS to `static/styles.css` (minified)
- **Type check, lint, and format**: `deno task check`
  - Runs `deno fmt --check`, `deno lint`, and type checks all TypeScript files
- **Production server**: `deno task preview`

### Testing

- There are currently no automated tests in this repository
- Manual testing is done by running the development server and using the API endpoints

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

- **routes/**: File-based routing (Fresh convention)
  - `routes/_app.tsx`: Root application component
  - `routes/index.tsx`: Homepage
  - `routes/auth/`: OAuth authentication routes
  - `routes/api/`: REST API endpoints
  - `routes/series/`: Series-related UI routes
- **islands/**: Interactive client-side components (hydrated on client)
- **components/**: Shared server-side components
- **utils/**: Utility functions and shared logic
- **static/**: Static assets (served from root `/`)

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

- Use Tailwind CSS utility classes
- daisyUI component classes are available (theme: "yawt")
- Global styles are in `styles/tailwind.css`
- Built CSS output goes to `static/styles.css`

## Architecture Notes

### Fresh Framework

- Fresh uses an island architecture: most components render on the server, only "islands" are interactive
- Routes are defined by file structure in the `routes/` directory
- Islands must be in the `islands/` directory and are automatically hydrated
- No build step required during development
- Server-side rendering provides fast initial page loads

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

- `GITHUB_CLIENT_ID`: Required for OAuth
- `GITHUB_CLIENT_SECRET`: Required for OAuth
- `OAUTH_REDIRECT_URI`: OAuth callback URL (default: `http://localhost:8000/auth/callback`)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`: Optional, for R2 image uploads
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

## Common Tasks

### Adding a New API Endpoint

1. Create a file in `routes/api/` following the URL structure
2. Export a `handler: Handlers` object with HTTP methods
3. Use `requireUser()` to enforce authentication
4. Use KV helpers for data access
5. Return responses using `@utils/http.ts` utilities

### Adding a New Interactive Component

1. Create a file in `islands/`
2. Export a Preact component
3. Import and use in routes or other components
4. Component will be automatically hydrated on the client

### Adding a New Type

1. Add type definition to `@utils/story/types.ts`
2. Add KV key helper to `@utils/story/keys.ts` if needed
3. Update API routes and UI components

### Modifying Styles

1. Edit `styles/tailwind.css` for global styles
2. Use Tailwind utility classes in components
3. Run `deno task start` to rebuild CSS automatically
4. For production, run `deno task build`
