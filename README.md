# yawt

yet-another-writing-tool

A modern writing tool with a [Deno](https://deno.land/) +
[Fresh](https://fresh.deno.dev/) backend and a
[React](https://react.dev/) + [Vite](https://vite.dev/) single-page application
frontend.

## Prerequisites

- [Deno](https://deno.land/) 2.6.4 or later
- [Node.js](https://nodejs.org/) 20+ and npm (for the React client)

## Getting Started

### Installation

Install Deno if you haven't already:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

### OAuth Configuration

To use GitHub OAuth authentication, follow the detailed steps in
[SETUP.md](SETUP.md).

Quick setup:

1. Create a GitHub OAuth App at
   [https://github.com/settings/developers](https://github.com/settings/developers)
2. For local development, configure:
   - **Application name**: YAWT (local)
   - **Homepage URL**: `http://localhost:8000`
   - **Authorization callback URL**: `http://localhost:8000/auth/callback`
3. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

4. Update `.env` with your GitHub OAuth credentials:
   - `OAUTH_CLIENT_ID`: Your GitHub OAuth App Client ID
   - `OAUTH_CLIENT_SECRET`: Your GitHub OAuth App Client Secret

### Development

**Option 1 — Full stack (Fresh + Vite, recommended):**

```bash
# Install client dependencies first (one time)
cd client && npm install && cd ..

deno task start:full
```

This starts three processes concurrently:

- Tailwind CSS watch for `static/styles.css` (Fresh styles)
- Fresh server with hot reload at `http://localhost:8000`
- Vite dev server at `http://localhost:5173` (proxies `/api` and `/auth` to Fresh)

During development, access the React SPA at `http://localhost:5173`. The Fresh
server handles all API/auth routes.

**Option 2 — Backend only:**

```bash
deno task start
```

Starts Tailwind watch + Fresh server. The React SPA will be served from the
last build at `http://localhost:8000/client`.

**Option 3 — React client only (requires Fresh server already running):**

```bash
deno task client:dev
```

### Component Stories (Fresh/Preact components)

View component documentation and examples at `http://localhost:8000/stories/`
when the Fresh development server is running.

This project uses [Denostories](https://github.com/CAYdenberg/denostories) for
Fresh/Preact component development and documentation. See
[docs/DENOSTORIES.md](docs/DENOSTORIES.md) for details.

### Production

Build and run the production server:

```bash
# Build the React SPA (output goes to static/client/)
deno task client:build

# Build CSS + Fresh, then start
deno task preview
```

The production server serves the React SPA from `static/client/` at
`http://localhost:8000/client`.

To build only the CSS:

```bash
deno task build
```

### Code Quality

Run type checking, linting, and formatting for the Deno/Fresh backend:

```bash
deno task check
```

For the React client:

```bash
cd client && npm run lint
```

## Project Structure

```
├── routes/              # Fresh file-based routing (backend + SSR pages)
│   ├── _app.tsx        # Root application component
│   ├── index.tsx       # Homepage route
│   ├── [...path].tsx   # Catchall — serves the built React SPA
│   ├── auth/           # OAuth authentication routes
│   │   ├── signin.ts   # GitHub OAuth sign-in
│   │   ├── signout.ts  # Sign-out route
│   │   └── callback.ts # OAuth callback handler
│   ├── admin/          # Admin dashboard (RBAC-protected)
│   └── api/            # REST API routes
│       ├── me.ts       # Get/update current user info
│       ├── admin/      # Admin user management
│       ├── series.ts   # List/create series
│       └── series/[seriesId]/
│           ├── books.ts / books/[bookId].ts
│           ├── books/[bookId]/scenes.ts / scenes/[sceneId].ts
│           ├── characters.ts / characters/[characterId].ts
│           ├── locations.ts / locations/[locationId].ts
│           ├── events.ts / events/[eventId].ts
│           └── timelines.ts / timelines/[timelineId](.ts|/events.ts)
├── client/              # React + Vite SPA
│   ├── src/
│   │   ├── api/        # API fetch helpers (series, books, scenes, …)
│   │   ├── components/ # React components (layout, ui/, ProtectedRoute, …)
│   │   ├── contexts/   # React context providers
│   │   ├── hooks/      # TanStack Query hooks
│   │   ├── pages/      # Page components (SeriesListPage, BookDetailPage, …)
│   │   ├── types/      # TypeScript type definitions
│   │   ├── App.tsx     # React Router setup (basename="/client")
│   │   └── main.tsx    # React entry point
│   ├── components.json # shadcn/ui configuration
│   ├── vite.config.ts  # Vite config (builds to ../static/client/)
│   └── package.json    # npm dependencies
├── utils/              # Deno utility functions
│   ├── auth/           # RBAC types, permissions, guards
│   ├── oauth.ts        # OAuth configuration
│   ├── session.ts      # Session management
│   ├── http.ts         # HTTP helpers (requireUser, requireAdmin, json, …)
│   ├── kv.ts           # Deno KV instance
│   └── story/          # Data types, KV keys, frontmatter parsing
├── islands/            # Preact interactive islands (Fresh)
├── components/         # Shared Preact/server components (Fresh)
├── static/             # Static assets served from /
│   └── client/         # Built React SPA output (generated)
├── styles/             # Source Tailwind CSS for Fresh
├── fresh.config.ts     # Fresh framework configuration
├── fresh.gen.ts        # Generated manifest (auto-updated)
├── main.ts             # Production server entry point
├── dev.ts              # Development server with hot reload
└── deno.json           # Deno configuration and dependencies
```

## Technology Stack

### Backend (Deno / Fresh)

- **Runtime**: Deno 2.6.4+
- **Framework**: Fresh 1.6.1 (file-based routing, SSR, island architecture)
- **UI Library**: Preact 10.19.2 (server-rendered + Preact islands)
- **Styling**: Tailwind CSS 3 + daisyUI 4 (yawt theme; built to `static/styles.css`)
- **Authentication**: GitHub OAuth2 via [@deno/kv-oauth](https://github.com/denoland/deno_kv_oauth)
- **Storage**: Deno KV (built-in key-value database)
- **RBAC**: Role-based access control (`admin` / `subscriber` / `free`)
- **Images**: Optional Cloudflare R2 (uploads via same-origin API route)
- **Component Development**: Denostories 0.3.0

### Frontend (React SPA — served at `/client`)

- **Build tool**: Vite 8
- **Framework**: React 19
- **Language**: TypeScript 5.9.3
- **Routing**: React Router 7 (basename `/client`)
- **Data fetching**: TanStack Query 5
- **Styling**: Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com) (New York style, zinc base)
- **Icons**: Lucide React
- **Drag & drop**: dnd-kit
- **Dev port**: 5173 (proxies `/api` and `/auth` to Fresh on port 8000)

## Features

### Authentication

- GitHub OAuth2 integration for user authentication
- Session-based authentication using Deno KV
- Secure sign-in/sign-out flows

### REST API

All API endpoints require authentication via GitHub OAuth.

#### Endpoints

**Auth**

- **GET /api/me** - Get current authenticated user information

**Series**

- **GET /api/series** - List series
- **POST /api/series** - Create series
  - Body: `{ "title": "string", "description"?: "string" }`
- **GET /api/series/[id]** - Get a series
- **PUT /api/series/[id]** - Update a series
  - Body: `{ "title"?: "string", "description"?: "string" }`
- **DELETE /api/series/[id]** - Delete a series (409 if non-empty)

**Books**

- **GET /api/series/[seriesId]/books** - List books (rank-ordered)
- **POST /api/series/[seriesId]/books** - Create book
  - Body:
    `{ "title": "string", "author"?: "string", "publishDate"?: "string", "isbn"?: "string" }`
- **GET /api/series/[seriesId]/books/[bookId]** - Get a book
- **PUT /api/series/[seriesId]/books/[bookId]** - Update a book
  - Body:
    `{ "title"?: "string", "author"?: "string", "publishDate"?: "string", "isbn"?: "string" }`
- **DELETE /api/series/[seriesId]/books/[bookId]** - Delete a book (409 if
  non-empty)

**Scenes**

- **GET /api/series/[seriesId]/books/[bookId]/scenes** - List scenes
  (rank-ordered)
- **POST /api/series/[seriesId]/books/[bookId]/scenes** - Create scene
  - Body: `{ "text": "string" }`
- **GET /api/series/[seriesId]/books/[bookId]/scenes/[sceneId]** - Get a scene
- **PUT /api/series/[seriesId]/books/[bookId]/scenes/[sceneId]** - Update a
  scene
  - Body: `{ "text": "string" }`
- **DELETE /api/series/[seriesId]/books/[bookId]/scenes/[sceneId]** - Delete a
  scene
- **POST /api/series/[seriesId]/books/[bookId]/scenes/[sceneId]/reorder** -
  Reorder a scene
  - Body: `{ "beforeSceneId"?: "string", "afterSceneId"?: "string" }` (provide
    at least one)

Scenes support YAML frontmatter embedded in `text` to derive metadata (e.g.
title, dates, tags, etc.).

**Characters**

- **GET /api/series/[seriesId]/characters** - List characters
- **POST /api/series/[seriesId]/characters** - Create character
  - Body: `{ "name": "string", "description"?: "string", "extra"?: { ... } }`
- **GET /api/series/[seriesId]/characters/[characterId]** - Get a character
- **PUT /api/series/[seriesId]/characters/[characterId]** - Update a character
  - Body:
    `{ "name"?: "string", "description"?: "string", "image"?: { ... }, "extra"?: { ... } }`
- **POST /api/series/[seriesId]/characters/[characterId]/image/upload** - Upload
  a character image to R2 (server-side)
  - Content-Type: `multipart/form-data`
  - Form field: `file` (image/png|jpeg|webp|gif)
  - Returns: `{ objectKey, contentType, bytes }`

**Locations**

- **GET /api/series/[seriesId]/locations** - List locations
- **POST /api/series/[seriesId]/locations** - Create location
  - Body:
    `{ "name": "string", "description"?: "string", "tags"?: string[] | string, "links"?: [...], "coords"?: { ... }, "extra"?: { ... } }`
- **GET /api/series/[seriesId]/locations/[locationId]** - Get a location
- **PUT /api/series/[seriesId]/locations/[locationId]** - Update a location
- **DELETE /api/series/[seriesId]/locations/[locationId]** - Delete a location

**Events**

- **GET /api/series/[seriesId]/events** - List events
- **POST /api/series/[seriesId]/events** - Create event
  - Body:
    `{ "title": "string", "description"?: "string", "startDate"?: "string", "endDate"?: "string", "locationId"?: "string", "characterIds"?: string[], "sceneIds"?: string[], "tags"?: string[] }`
- **GET /api/series/[seriesId]/events/[eventId]** - Get an event
- **PUT /api/series/[seriesId]/events/[eventId]** - Update an event
  - Body: Same as POST (all fields optional)
- **DELETE /api/series/[seriesId]/events/[eventId]** - Delete an event

**Timelines**

- **GET /api/series/[seriesId]/timelines** - List timelines
- **POST /api/series/[seriesId]/timelines** - Create timeline
  - Body: `{ "title": "string", "description"?: "string" }`
- **GET /api/series/[seriesId]/timelines/[timelineId]** - Get a timeline
- **PUT /api/series/[seriesId]/timelines/[timelineId]** - Update a timeline
- **DELETE /api/series/[seriesId]/timelines/[timelineId]** - Delete a timeline
- **GET /api/series/[seriesId]/timelines/[timelineId]/events** - List timeline
  “events” derived from dated scenes
  - Note: `POST` returns 400; add `startDate`/`endDate` (and optionally
    `timelines: [<timelineId>]`) in scene frontmatter.

**Legacy: Notes**

- **GET /api/notes** - List notes
- **POST /api/notes** - Create a note
  - Body: `{ "title": "string", "content": "string" }`
- **GET /api/notes/[id]** - Get a note
- **PUT /api/notes/[id]** - Update a note
  - Body: `{ "title"?: "string", "content"?: "string" }`
- **DELETE /api/notes/[id]** - Delete a note

#### Example Usage:

```bash
# Get current user (requires active session)
curl http://localhost:8000/api/me

# Create a series
curl -X POST http://localhost:8000/api/series \
  -H "Content-Type: application/json" \
  -d '{"title": "My Series"}'

# List series
curl http://localhost:8000/api/series

# Create a book
curl -X POST http://localhost:8000/api/series/[series-id]/books \
  -H "Content-Type: application/json" \
  -d '{"title": "Book 1"}'

# Create a scene
curl -X POST http://localhost:8000/api/series/[series-id]/books/[book-id]/scenes \
  -H "Content-Type: application/json" \
  -d '{"text": "---\ntitle: Arrival\nstartDate: 2026-01-01\n---\n\nScene text..."}'

# Create an event
curl -X POST http://localhost:8000/api/series/[series-id]/events \
  -H "Content-Type: application/json" \
  -d '{"title": "The Great Battle", "startDate": "2026-03-15", "endDate": "2026-03-16", "sceneIds": ["scene-id-1", "scene-id-2"], "characterIds": ["char-id-1"], "locationId": "loc-id-1", "tags": ["war", "climax"]}'

# List events
curl http://localhost:8000/api/series/[series-id]/events

# Timeline view (derived from dated scenes)
curl http://localhost:8000/api/series/[series-id]/timelines/[timeline-id]/events
```

## Architecture

### Dual-stack design

YAWT uses a **dual-stack** approach:

1. **Fresh backend** (`routes/`, `islands/`, `components/`, `utils/`): handles
   all authentication, API endpoints, Deno KV storage, and RBAC. Also renders
   some server-side pages (homepage, admin dashboard, stories viewer) using
   Preact + daisyUI.

2. **React SPA** (`client/`): the primary writing interface. Built with Vite and
   deployed to `static/client/`. Served by the Fresh catchall route
   `routes/[...path].tsx` at `/client/*` in production. During development, Vite
   proxies all `/api` and `/auth` calls to the Fresh server.

### Fresh framework highlights

- **Zero build step** for the backend: no build process required during
  development
- **Island architecture**: interactive Preact components are hydrated on the
  client; most pages are server-rendered
- **File-based routing**: routes are defined purely by file structure
- **TypeScript-first**: full TypeScript support out of the box

## License

See [LICENSE](LICENSE) file for details.
