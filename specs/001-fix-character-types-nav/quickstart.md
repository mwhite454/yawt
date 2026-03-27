````markdown
# Quickstart: Test Character Types Navigation Fix (local)

1. Start dev server (Tailwind watch + Fresh):

```bash
deno task start
```
````

2. Open app in browser: http://localhost:8000

3. Sign in with GitHub (if required) and navigate to a Series page: `/series/{seriesId}/characters`.

4. Click a Character Type to open the editor. The header should show `Back to Characters` and navigate to `/series/{seriesId}/characters` in one click.

5. API curl examples (replace session cookie if required):

```bash
# List types
curl -v http://localhost:8000/api/series/123/characters \
  -H "Cookie: session=YOUR_SESSION_COOKIE"

# Create
curl -X POST http://localhost:8000/api/series/123/characters \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{"name":"Goblin","description":"Short humanoid"}'
```

6. Tests: add integration tests that open the editor page, perform edits, save, then confirm the `series/{seriesId}/characters` list shows updates.

```

```
