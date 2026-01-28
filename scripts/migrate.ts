import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/lib/db/schema';

const databaseUrl = process.env.DATABASE_URL || 'file:./bausmail.db';
const dbPath = databaseUrl.replace('file:', '');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

const db = drizzle(sqlite, { schema });

console.log('Running migrations...');

migrate(db, { migrationsFolder: './drizzle' });

console.log('Migrations completed!');

sqlite.close();
