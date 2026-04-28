# Security Policy

## Supported Version

BausMail is currently pre-1.0. Security fixes are handled on the latest `main` branch.

## Reporting a Vulnerability

Please do not open a public issue for a security vulnerability.

Email the maintainer or use GitHub private vulnerability reporting if it is enabled for the repository. Include:

- A short description of the issue
- Steps to reproduce
- Impacted routes, components, or deployment settings
- Any suggested fix or mitigation

## Deployment Security Notes

BausMail `v0.1.0` is designed for trusted, self-hosted, single-tenant deployments.

Resend API keys are read from the server-only `RESEND_DOMAIN_API_KEYS` environment variable and are not stored in the database. Anyone with access to production environment variables can read them. Use least-privilege infrastructure access, strong Postgres credentials, encrypted backups, and scoped Resend keys where possible.

Required production settings:

- Set `AUTH_SECRET` to a long random value.
- Set `AUTH_ALLOWED_EMAILS` to the exact admin email addresses allowed to sign in.
- Set `AUTH_ADMIN_PASSWORD` to a strong password.
- Set `RESEND_WEBHOOK_SECRET` from the Resend webhook dashboard, or `RESEND_WEBHOOK_SECRETS` as a comma-separated list when using multiple Resend webhook endpoints.
- Set `RESEND_DOMAIN_API_KEYS` to a JSON map of domain names to Resend API keys.
- Keep `/api/webhooks/resend` signature verification enabled.
