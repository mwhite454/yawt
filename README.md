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
│       ├── notes.ts    # List/create notes
│       └── notes/
│           └── [id].ts # Get/update/delete individual note
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
- **Styling**: Tailwind CSS + daisyUI (built to `static/styles.css`)
- **Authentication**: GitHub OAuth2 via
  [@deno/kv-oauth](https://github.com/denoland/deno_kv_oauth)
- **Storage**: Deno KV (built-in key-value database)

## Features

### Authentication

- GitHub OAuth2 integration for user authentication
- Session-based authentication using Deno KV
- Secure sign-in/sign-out flows

### REST API

All API endpoints require authentication via GitHub OAuth.

#### Endpoints:

- **GET /api/me** - Get current authenticated user information
- **GET /api/notes** - List all notes for the authenticated user
- **POST /api/notes** - Create a new note
  - Body: `{ "title": "string", "content": "string" }`
- **GET /api/notes/[id]** - Get a specific note
- **PUT /api/notes/[id]** - Update a note
  - Body: `{ "title": "string", "content": "string" }` (both optional)
- **DELETE /api/notes/[id]** - Delete a note

#### Example Usage:

```bash
# Get current user (requires active session)
curl http://localhost:8000/api/me

# Create a note
curl -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "My Note", "content": "Hello World"}'

# List all notes
curl http://localhost:8000/api/notes

# Update a note
curl -X PUT http://localhost:8000/api/notes/[note-id] \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete a note
curl -X DELETE http://localhost:8000/api/notes/[note-id]
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
