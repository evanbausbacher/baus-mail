import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:ProtoLink1755@localhost:5432/bausmail';

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
