# BausMail

Self-hosted email for indie devs and founders running multiple apps on Resend.

BausMail is a focused web email client for managing several Resend-powered domains from one dashboard. It is built for small teams and solo operators who want a simple inbox, sent mail, search, threading, and compose flow without wiring a custom admin panel for every product.

## Status

BausMail is open source and currently at `v0.1.0`. It is useful today for trusted self-hosted deployments, but it is still early software. Review the security notes before deploying it with real customer email.

## Features

- Multi-domain mailbox management for Resend domains
- Inbox and sent mail views
- Compose, reply, and forward flows
- Star, delete, read/unread, and spam actions
- Search across synced email content
- Email threading support
- Resend inbound webhook ingestion
- Manual sync fallback for received and sent messages
- Postgres storage with Drizzle ORM migrations
- Credentials-based admin access with an email allowlist

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Postgres
- Drizzle ORM
- Auth.js / NextAuth credentials auth
- Resend API and Svix webhook verification

## Quick Start

### Prerequisites

- Node.js 18 or newer
- npm
- Postgres
- A Resend account with at least one verified domain

### Install

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

## Environment Variables

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bausmail
DATABASE_POOL_MAX=10

NEXT_PUBLIC_APP_URL=http://localhost:3000

AUTH_SECRET=replace-with-a-long-random-secret
AUTH_ALLOWED_EMAILS=you@example.com
AUTH_ADMIN_PASSWORD=replace-with-a-strong-password

RESEND_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_POLLING_INTERVAL=30000
```

Notes:

- `DATABASE_URL` is required locally. Hosted Postgres providers may expose `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, or `POSTGRES_URL_NON_POOLING`; the app can read those too.
- `AUTH_ALLOWED_EMAILS` is a comma-separated allowlist for admin sign-in.
- `AUTH_ADMIN_PASSWORD` is the shared password for allowed admin emails.
- `AUTH_SECRET` is required by Auth.js in production.
- `RESEND_WEBHOOK_SECRET` must match the signing secret from the Resend webhook dashboard.

## Resend Setup

1. Verify each sending/receiving domain in Resend.
2. Start BausMail and sign in with an allowed admin email.
3. Add a domain from the sidebar and paste a Resend API key for that domain.
4. In Resend, create an inbound webhook endpoint that points to:

```text
https://your-app.example.com/api/webhooks/resend
```

5. Subscribe the endpoint to received-email events and copy the webhook signing secret into `RESEND_WEBHOOK_SECRET`.
6. Use the sync button in BausMail to backfill or refresh mail when needed.

For local webhook testing, expose your dev server with a tunnel and set the webhook URL to the public tunnel URL plus `/api/webhooks/resend`.

## Deployment

BausMail is a standard Next.js app. The included `build:vercel` script runs migrations before building:

```bash
npm run build:vercel
```

For other hosts, run the migration step during release:

```bash
npm run db:migrate
npm run build
npm run start
```

Make sure production environment variables are set in your hosting provider before the first migration.

## Security Notes

BausMail `v0.1.0` is intended for trusted, self-hosted, single-tenant deployments.

Important: Resend API keys are currently stored in the application database as plaintext so the app can sync and send mail per domain. Anyone with database access can read those keys. Use a locked-down database, least-privilege hosting access, and domain-scoped API keys where possible.

The Resend webhook route verifies Svix signatures with `RESEND_WEBHOOK_SECRET`. Do not disable that check in production.

Report vulnerabilities privately using the process in [SECURITY.md](./SECURITY.md).

## Development

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Project Layout

```text
src/app/          Next.js pages and API routes
src/components/   React UI and feature components
src/hooks/        Client hooks
src/lib/db/       Drizzle schema, database connection, and queries
src/lib/resend/   Resend API client and mapping helpers
src/lib/threading Email threading logic
drizzle/          SQL migrations and Drizzle metadata
docs/             Project notes and reference material
```

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md), open an issue for larger changes, and keep pull requests focused.

## License

MIT. See [LICENSE](./LICENSE).
