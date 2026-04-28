# Contributing

Thanks for helping improve BausMail.

## Development Setup

```bash
git clone https://github.com/evanbausbacher/baus-mail.git
cd baus-mail
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Use Node.js 18 or newer and Postgres.

## Pull Requests

- Keep changes focused and explain the user-facing reason for the change.
- Run `npm run lint` and `npm run build` before opening a pull request.
- Do not commit `.env*`, local databases, `.vercel`, `.next`, `node_modules`, or worktree files.
- For API, schema, or security-sensitive changes, include the migration or documentation update in the same pull request.
- Open an issue first for large UI rewrites, auth changes, database changes, or provider-level changes.

## Code Style

- Follow the existing TypeScript and React patterns.
- Prefer small, explicit helpers over broad abstractions.
- Keep UI changes consistent with the current Tailwind design system.
- Use Drizzle migrations for database schema changes.

## Security

Do not file public issues for vulnerabilities. Use the private reporting process in [SECURITY.md](./SECURITY.md).
