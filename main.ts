/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { join, normalize } from "https://deno.land/std@0.216.0/path/mod.ts";

const port = 8000;
const STATIC_DIR = "./static";
const STATIC_ROUTE_PREFIX = "/static/";

// Get absolute path for static directory (create if doesn't exist)
try {
  await Deno.mkdir(STATIC_DIR, { recursive: true });
} catch {
  // Directory already exists
}
const STATIC_DIR_ABS = Deno.realPathSync(STATIC_DIR);

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".html": "text/html",
  ".txt": "text/plain",
};

function getContentType(filepath: string): string {
  const ext = filepath.substring(filepath.lastIndexOf("."));
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

// Simple HTML template
function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YAWT - Yet Another Writing Tool</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      background: #f9fafb;
      padding: 4rem 1rem;
    }
    .container {
      max-width: 56rem;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 3rem;
    }
    h1 {
      font-size: 3rem;
      font-weight: bold;
      color: #111827;
      margin-bottom: 1rem;
    }
    .subtitle {
      font-size: 1.25rem;
      color: #6b7280;
    }
    main {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
    }
    p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin-top: 1rem;
    }
    .info-box p {
      color: #1e40af;
      margin-bottom: 0;
    }
    .tech-stack {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }
    .tech-list {
      list-style: none;
      padding: 0;
    }
    .tech-list li {
      padding: 0.5rem 0;
      color: #374151;
    }
    .tech-list strong {
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>YAWT</h1>
      <p class="subtitle">Yet Another Writing Tool</p>
    </header>
    
    <main>
      <div>
        <h2>Welcome to YAWT</h2>
        <p>A modern writing tool built with Deno and Fresh framework.</p>
        <div class="info-box">
          <p>
            <strong>Getting Started:</strong> This is a Fresh project built with Deno ${Deno.version.deno}.
          </p>
        </div>
        
        <div class="tech-stack">
          <h2>Technology Stack</h2>
          <ul class="tech-list">
            <li><strong>Runtime:</strong> Deno ${Deno.version.deno}</li>
            <li><strong>TypeScript:</strong> ${Deno.version.typescript}</li>
            <li><strong>V8 Engine:</strong> ${Deno.version.v8}</li>
            <li><strong>Framework:</strong> Fresh (file-based routing)</li>
            <li><strong>UI:</strong> Preact with JSX</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Serve static files
  if (url.pathname.startsWith(STATIC_ROUTE_PREFIX)) {
    try {
      // Remove /static/ prefix and normalize the path
      const requestedPath = url.pathname.substring(
        STATIC_ROUTE_PREFIX.length,
      );
      const normalizedPath = normalize(requestedPath);

      // Join with static directory and resolve to absolute path
      const filepath = join(STATIC_DIR, normalizedPath);
      const absolutePath = Deno.realPathSync(filepath);

      // Security check: ensure the resolved path is within the static directory
      if (!absolutePath.startsWith(STATIC_DIR_ABS)) {
        return new Response("Forbidden", { status: 403 });
      }

      const file = await Deno.readFile(absolutePath);
      const contentType = getContentType(filepath);

      return new Response(file, {
        headers: { "content-type": contentType },
      });
    } catch (error) {
      // Return 403 for path traversal attempts, 404 for missing files
      if (error instanceof Deno.errors.NotFound) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Serve HTML for all other routes
  const html = renderHTML();

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

console.log(`🦕 YAWT server running on http://localhost:${port}`);
console.log(`📝 A writing tool built with Deno ${Deno.version.deno}`);
console.log();
console.log("Ready to accept connections...");

await Deno.serve({ port }, handler).finished;
