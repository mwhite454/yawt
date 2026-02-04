## Environment Setup

This repository uses GitHub Secrets for sensitive configuration.

### For CI/CD (GitHub Actions):

Environment variables are automatically injected from repository secrets.

### For Local Development:

1. Copy `.env.example` to `.env`
2. Fill in the required values
3. Never commit `.env` to the repository
