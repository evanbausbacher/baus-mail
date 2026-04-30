# BausMail

Self-hosted email for indie devs and founders running multiple apps on Resend.

[Live landing page](https://bausmail.evanbausbacher.com) | [Security policy](./SECURITY.md) | [Contributing](./CONTRIBUTING.md)

BausMail is a focused web email client for managing several Resend-powered domains from one dashboard. It supports inbox and sent mail, compose/reply/forward, search, threading, webhook ingestion, manual sync, Postgres storage, and allowlisted admin access.

> Status: early `v0.1.0` software for trusted, self-hosted, single-tenant deployments. Read the security notes before using it with real customer email.

## Mockups

<p align="center">
  <img src="./public/readme/mockup-desktop.svg" alt="BausMail desktop inbox mockup" width="900">
</p>

<p align="center">
  <img src="./public/readme/mockup-mobile.svg" alt="BausMail mobile inbox mockup" width="260">
  <img src="./public/readme/resend-setup.svg" alt="BausMail Resend setup model" width="560">
</p>

## Quick Start

Prerequisites: Node.js 20.9+, npm, Postgres, and a Resend account with at least one verified domain.

```bash
git clone https://github.com/evanbausbacher/baus-mail.git
cd baus-mail
npm install
cp .env.example .env.local
```

Fill in `.env.local`, then run:

```bash
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Resend Setup

1. Verify each sending/receiving domain in Resend.
2. Create a Resend API key for each domain.
3. Add those keys to the server-only `RESEND_DOMAIN_API_KEYS` JSON object.
4. Deploy or start BausMail, then sign in with an allowlisted admin email.
5. In Resend, create a webhook endpoint for `https://your-app.example.com/api/webhooks/resend`.
6. Subscribe the endpoint to `email.received` and `email.sent`.
7. Copy the Resend webhook signing secret into `RESEND_WEBHOOK_SECRET`.
8. Use the sync button in BausMail when you need to backfill or refresh mail.

For multiple webhook endpoints, point each one to the same `/api/webhooks/resend` URL and put every signing secret in `RESEND_WEBHOOK_SECRETS`.

For local webhook testing, expose your dev server with a tunnel and use the public tunnel URL plus `/api/webhooks/resend`.

## Environment

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bausmail
DATABASE_POOL_MAX=10

NEXT_PUBLIC_APP_URL=http://localhost:3000

AUTH_SECRET=replace-with-a-long-random-secret
AUTH_ALLOWED_EMAILS=you@example.com
AUTH_ADMIN_PASSWORD=replace-with-a-strong-password

RESEND_WEBHOOK_SECRET=whsec_...
RESEND_WEBHOOK_SECRETS=whsec_...,whsec_...
RESEND_DOMAIN_API_KEYS='{"example.com":"re_...","another-app.com":"re_..."}'

NEXT_PUBLIC_POLLING_INTERVAL=30000
```

Important notes:

- `AUTH_ALLOWED_EMAILS` is a comma-separated admin sign-in allowlist.
- `AUTH_ADMIN_PASSWORD` is the shared password for allowed admin emails.
- `AUTH_SECRET` is required by Auth.js in production.
- `RESEND_DOMAIN_API_KEYS` maps domain names to Resend API keys and is matched case-insensitively.
- Resend API keys are read from server environment variables and are not stored in the application database.
- The webhook route verifies Svix signatures with `RESEND_WEBHOOK_SECRET` or `RESEND_WEBHOOK_SECRETS`.

## Deployment

BausMail is a standard Next.js app. For Vercel, set production environment variables first, then use:

```bash
npm run build:vercel
```

For other hosts:

```bash
npm run db:migrate
npm run build
npm run start
```

If upgrading from an older database that stored Resend API keys, configure `RESEND_DOMAIN_API_KEYS` before running migrations. The migration removes the stored `domains.api_key` column.

## Development

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:studio
```

Project map:

```text
src/app/          Next.js pages and API routes
src/components/   React UI and feature components
src/lib/db/       Drizzle schema, connection, and queries
src/lib/resend/   Resend API client and mapping helpers
src/lib/threading Email threading logic
drizzle/          SQL migrations and metadata
```

## License

MIT. See [LICENSE](./LICENSE).
