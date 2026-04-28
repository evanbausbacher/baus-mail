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

Resend API keys are stored in the database as plaintext. Anyone with database access can read them. Use least-privilege infrastructure access, strong Postgres credentials, encrypted backups, and scoped Resend keys where possible.

Required production settings:

- Set `AUTH_SECRET` to a long random value.
- Set `AUTH_ALLOWED_EMAILS` to the exact admin email addresses allowed to sign in.
- Set `AUTH_ADMIN_PASSWORD` to a strong password.
- Set `RESEND_WEBHOOK_SECRET` from the Resend webhook dashboard.
- Keep `/api/webhooks/resend` signature verification enabled.
