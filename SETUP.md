# YAWT OAuth2 Setup Guide

This guide walks you through setting up GitHub OAuth2 authentication for YAWT.

## Prerequisites

- Deno 1.38.5 or later installed
- A GitHub account
- Basic familiarity with OAuth2 flows

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App" button
4. Fill in the application details:
   - **Application name**: `YAWT` (or any name you prefer)
   - **Homepage URL**: `http://localhost:8000` (for local development)
   - **Application description**: (optional) "Yet Another Writing Tool"
   - **Authorization callback URL**: `http://localhost:8000/auth/callback`
5. Click "Register application"
6. On the next page, you'll see your **Client ID**
7. Click "Generate a new client secret" to get your **Client Secret**
8. **Important**: Copy both the Client ID and Client Secret - you'll need them in the next step

## Step 2: Configure Environment Variables

1. In the project root, copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update with your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_actual_client_id_here
   GITHUB_CLIENT_SECRET=your_actual_client_secret_here
   OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback
   ```

3. **Security Note**: The `.env` file is already in `.gitignore` and will not be committed to version control.

## Step 3: Start the Server

1. Start the development server:
   ```bash
   deno task start
   ```

2. Open your browser to [http://localhost:8000](http://localhost:8000)

## Step 4: Test Authentication

1. On the homepage, you should see a "Sign in with GitHub" button
2. Click the button to start the OAuth flow
3. You'll be redirected to GitHub to authorize the application
4. After authorization, you'll be redirected back to YAWT
5. If successful, you should see your GitHub profile information displayed

## Step 5: Test the API

Once authenticated, you can test the REST API endpoints:

### Using the Test Script

Run the included test script:
```bash
./test-api.sh
```

### Using curl

```bash
# Get current user info
curl http://localhost:8000/api/me

# Create a note
curl -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Note", "content": "Hello from YAWT!"}'

# List all notes
curl http://localhost:8000/api/notes

# Get a specific note (replace NOTE_ID with actual ID)
curl http://localhost:8000/api/notes/NOTE_ID

# Update a note
curl -X PUT http://localhost:8000/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete a note
curl -X DELETE http://localhost:8000/api/notes/NOTE_ID
```

### Using a REST Client

You can also use tools like:
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [HTTPie](https://httpie.io/)
- VS Code REST Client extension

## Production Deployment

For production deployment:

1. Create a new GitHub OAuth App with your production URL
2. Update the callback URL to match your production domain
3. Set environment variables on your hosting platform:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `OAUTH_REDIRECT_URI` (e.g., `https://yourdomain.com/auth/callback`)

## Troubleshooting

### "Unauthorized" errors
- Make sure you're authenticated by visiting the homepage and signing in
- Check that your session cookie is being sent with requests

### OAuth callback fails
- Verify the callback URL in your GitHub OAuth App matches the one in your `.env` file
- Check that the URL is exactly: `http://localhost:8000/auth/callback`

### "Invalid credentials" errors
- Double-check your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`
- Make sure there are no extra spaces or quotes in the values

### Server won't start
- Ensure Deno is installed: `deno --version`
- Check for syntax errors: `deno task check`
- Verify all dependencies can be downloaded

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use environment-specific OAuth Apps** - Separate apps for development, staging, and production
3. **Rotate secrets regularly** - GitHub allows you to regenerate client secrets
4. **Use HTTPS in production** - OAuth requires secure connections in production
5. **Limit OAuth scopes** - Only request the minimum permissions needed (currently just `user:email`)

## API Documentation

See [README.md](README.md) for complete API documentation and endpoint details.

## Need Help?

- Check the [Fresh documentation](https://fresh.deno.dev/)
- Review [Deno KV OAuth documentation](https://github.com/denoland/deno_kv_oauth)
- Read [GitHub OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
