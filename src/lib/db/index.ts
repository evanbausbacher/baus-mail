import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { getDatabaseUrl } from './env';

const connectionString = getDatabaseUrl();

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL is required');
}

const globalForDb = globalThis as typeof globalThis & {
  bausMailPool?: Pool;
};

const pool =
  globalForDb.bausMailPool ??
  new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.bausMailPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
