import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { existsSync, readFileSync } from 'node:fs';
import { getDatabaseUrl } from '../src/lib/db/env';

for (const file of ['.env.local', '.env.development.local', '.env.production.local']) {
  if (!existsSync(file)) continue;

  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const connectionString = getDatabaseUrl();

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL is required');
}

async function main() {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log('Running migrations...');

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Migrations completed!');

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
