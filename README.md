# yawt

yet-another-writing-tool

A modern writing tool built with [Deno](https://deno.land/) and the
[Fresh](https://fresh.deno.dev/) web framework.

## Prerequisites

- [Deno](https://deno.land/) 2.6.4 or later

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
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret

### Development

Start the development server:

```bash
deno task start
```

This runs Tailwind+daisyUI in watch mode and rebuilds `static/styles.css` on
changes.

This will start the server at `http://localhost:8000`. The server will
automatically reload when you make changes to your code with the `--watch` flag.

### Production

To run the production server:

```bash
deno task preview
```

To build the CSS once (useful for deploy pipelines):

```bash
deno task build
```

### Code Quality

Run type checking, linting, and formatting:

```bash
deno task check
```

## Project Structure

```
├── routes/              # Application routes (file-based routing)
│   ├── _app.tsx        # Root application component
│   ├── index.tsx       # Homepage route
│   ├── auth/           # OAuth authentication routes
│   │   ├── signin.ts   # GitHub OAuth sign-in
│   │   ├── signout.ts  # Sign-out route
│   │   └── callback.ts # OAuth callback handler
│   └── api/            # REST API routes
│       ├── me.ts       # Get current user info
│       ├── notes.ts    # (Legacy) List/create notes
│       ├── notes/
│       │   └── [id].ts # (Legacy) Get/update/delete individual note
│       ├── series.ts   # List/create series
│       ├── series/
│       │   └── [id].ts # Get/update/delete a series
│       └── series/[seriesId]/
│           ├── books.ts
│           ├── books/[bookId].ts
│           ├── books/[bookId]/scenes.ts
│           ├── books/[bookId]/scenes/[sceneId].ts
│           ├── books/[bookId]/scenes/[sceneId]/reorder.ts
│           ├── characters.ts
│           ├── characters/[characterId].ts
│           ├── characters/[characterId]/image/upload.ts
│           ├── locations.ts
│           ├── locations/[locationId].ts
│           ├── timelines.ts
│           ├── timelines/[timelineId].ts
│           └── timelines/[timelineId]/events.ts
├── utils/              # Utility functions
│   ├── oauth.ts        # OAuth configuration
│   └── session.ts      # Session management
├── islands/            # Interactive client-side components
├── components/         # Shared components
├── static/             # Static assets (served from /)
├── fresh.config.ts     # Fresh framework configuration
├── fresh.gen.ts        # Generated manifest (auto-updated)
├── main.ts             # Application entry point (production server)
├── dev.ts              # Development server with hot reload
└── deno.json           # Deno configuration and dependencies
```

## Technology Stack

- **Runtime**: Deno 2.6.4
- **TypeScript**: 5.9.2
- **V8 Engine**: 14.2.231.17-rusty
- **Framework**: Fresh (file-based routing with Preact)
- **UI Library**: Preact 10.24.3 (lightweight React alternative)
- **Styling**: Tailwind CSS + daisyUI (Nord theme; built to `static/styles.css`)
- **Authentication**: GitHub OAuth2 via
  [@deno/kv-oauth](https://github.com/denoland/deno_kv_oauth)
- **Storage**: Deno KV (built-in key-value database)
- **Images**: Optional Cloudflare R2 (uploads via same-origin API route)

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

# Timeline view (derived from dated scenes)
curl http://localhost:8000/api/series/[series-id]/timelines/[timeline-id]/events
```

## About Fresh Framework

Fresh is a next-generation web framework built for Deno. Key features:

- **Zero build step**: No build process required during development
- **Island Architecture**: Interactive components ("islands") are hydrated on
  the client
- **File-based routing**: Routes are defined by the file structure
- **Server-side rendering**: Fast initial page loads with SSR
- **TypeScript-first**: Full TypeScript support out of the box

## License

See [LICENSE](LICENSE) file for details.
