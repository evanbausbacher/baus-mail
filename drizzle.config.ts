import type { Config } from 'drizzle-kit';
import { getDatabaseUrl } from './src/lib/db/env';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl() || 'postgres://postgres:postgres@localhost:5432/bausmail',
  },
} satisfies Config;
