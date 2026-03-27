# Contributing to YAWT

## Code Formatting

**IMPORTANT: Always run `deno fmt` before committing code.**

This project uses Deno's built-in formatter to maintain consistent code style.
Before every commit, run:

```bash
deno fmt
```

To check if files are properly formatted without modifying them:

```bash
deno fmt --check
```

AI agents and contributors must ensure all code is formatted before committing
to avoid formatting-related CI failures.

## Environment Setup

This repository uses GitHub Secrets for sensitive configuration.

### For CI/CD (GitHub Actions):

Environment variables are automatically injected from repository secrets.

### For Local Development:

1. Copy `.env.example` to `.env`
2. Fill in the required values
3. Never commit `.env` to the repository

## OAuth Configuration (Dev vs Production)

This project uses **two separate GitHub OAuth Apps** - one for local development
and one for production. This is necessary because GitHub OAuth requires exact
callback URL matching.

### Setting Up OAuth Apps

Create two OAuth Apps at https://github.com/settings/developers:

| Environment | App Name (suggested) | Homepage URL                | Callback URL                              |
| ----------- | -------------------- | --------------------------- | ----------------------------------------- |
| Development | YAWT (dev)           | `http://localhost:8000`     | `http://localhost:8000/auth/callback`     |
| Production  | YAWT                 | `https://www.7syllable.com` | `https://www.7syllable.com/auth/callback` |

### Local Development

Add your **dev** OAuth app credentials to your local `.env` file:

```
OAUTH_CLIENT_ID=your_dev_client_id
OAUTH_CLIENT_SECRET=your_dev_client_secret
```

### Production (Deno Deploy)

Set your **production** OAuth app credentials in the Deno Deploy dashboard:

1. Go to https://dash.deno.com → your project → Settings → Environment Variables
2. Add:
   - `OAUTH_CLIENT_ID` = production client ID
   - `OAUTH_CLIENT_SECRET` = production client secret

The app automatically detects the correct callback URL from the request, so you
don't need to set `OAUTH_REDIRECT_URI` unless you want to override the default.

## Deployment Considerations

### Build Artifact Size

Deno Deploy has limits on build artifact uploads. To keep the build size small:

1. **Use dynamic imports for heavy dependencies** - The AWS SDK (~15MB) is
   dynamically imported in `utils/r2.ts` so it's only loaded when R2 operations
   are actually used. This prevents the SDK from being bundled into the initial
   build.

   ```typescript
   // ❌ Don't do this - loads SDK at startup
   import { S3Client } from "npm:@aws-sdk/client-s3@3.540.0";

   // ✅ Do this instead - loads SDK only when needed
   const { S3Client } = await import("npm:@aws-sdk/client-s3@3.540.0");
   ```

2. **Keep test artifacts out of git** - Files in `.playwright-mcp/` and similar
   test output directories should be gitignored.

3. **Don't commit `node_modules/`** - While `deno.json` has
   `"nodeModulesDir": "auto"` for local npm compatibility, the directory should
   never be committed.

### Reverse Proxy Headers

When running behind a reverse proxy (like Deno Deploy), the request URL may not
reflect the actual public domain. The OAuth module handles this by checking:

- `x-forwarded-host` header for the public hostname
- `x-forwarded-proto` header for the protocol (http/https)

If you're deploying to a different platform, ensure these headers are forwarded
correctly.

## Troubleshooting

### "Failed to upload build artifact" on Deno Deploy

This usually means the build artifact is too large. Check for:

- Accidentally committed `node_modules/` or `_fresh/`
- Static imports of heavy npm packages (use dynamic imports instead)
- Large files that should be gitignored

### "redirect_uri is not associated with this application"

This GitHub OAuth error means the callback URL doesn't match. Verify:

1. The callback URL in your GitHub OAuth App settings matches exactly
2. You're using the correct OAuth app credentials for the environment
3. The `x-forwarded-host` header is being passed correctly (for production)

### OAuth works locally but not in production

You likely have the wrong OAuth credentials in Deno Deploy. Remember:

- Local `.env` → dev OAuth app credentials
- Deno Deploy env vars → production OAuth app credentials
