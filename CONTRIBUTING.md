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
