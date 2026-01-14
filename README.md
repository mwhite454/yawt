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

### Development

Start the development server:

```bash
deno task start
```

This will start the server at `http://localhost:8000`. The server will
automatically reload when you make changes to your code with the `--watch` flag.

### Production

To run the production server:

```bash
deno task preview
```

### Code Quality

Run type checking, linting, and formatting:

```bash
deno task check
```

## Project Structure

```
├── routes/           # Application routes (file-based routing)
│   ├── _app.tsx     # Root application component
│   └── index.tsx    # Homepage route
├── static/           # Static assets (served from /static/)
├── fresh.config.ts   # Fresh framework configuration
├── main.ts          # Application entry point (production server)
├── dev.ts           # Development server with hot reload
└── deno.json        # Deno configuration and dependencies
```

## Technology Stack

- **Runtime**: Deno 2.6.4
- **TypeScript**: 5.9.2
- **V8 Engine**: 14.2.231.17-rusty
- **Framework**: Fresh (file-based routing with Preact)
- **UI Library**: Preact 10.24.3 (lightweight React alternative)

## About Fresh Framework

Fresh is a next-generation web framework built for Deno. Key features:

- **Zero build step**: No build process required during development
- **Island Architecture**: Interactive components ("islands") are hydrated on
  the client
- **File-based routing**: Routes are defined by the file structure
- **Server-side rendering**: Fast initial page loads with SSR
- **TypeScript-first**: Full TypeScript support out of the box

## Development Notes

The current implementation uses a standalone server for demonstration purposes.
In a production environment with network access, you would integrate:

1. Full Fresh framework with JSX/TSX support
2. Preact for reactive UI components
3. Islands for client-side interactivity
4. File-based routing system

To add Fresh framework dependencies when network is available:

```json
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@2.0.0-alpha.22/",
    "preact": "https://esm.sh/preact@10.24.3",
    "preact/": "https://esm.sh/preact@10.24.3/",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.3.0"
  }
}
```

## License

See [LICENSE](LICENSE) file for details.
