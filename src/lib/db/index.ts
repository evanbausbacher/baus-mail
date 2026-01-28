import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'file:./bausmail.db';
const dbPath = databaseUrl.replace('file:', '');

// Initialize SQLite database
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export types
export type Database = typeof db;
