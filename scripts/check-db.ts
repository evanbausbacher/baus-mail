import { db } from '../src/lib/db/index';
import { emails, domains } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  console.log('Checking database...\n');

  // Count domains
  const domainCount = await db.select({ count: sql<number>`count(*)` }).from(domains);
  console.log(`Domains: ${domainCount[0].count}`);

  // List domains
  const allDomains = await db.select().from(domains);
  allDomains.forEach(d => {
    console.log(`  - ${d.name} (${d.id})`);
  });

  // Count emails
  const emailCount = await db.select({ count: sql<number>`count(*)` }).from(emails);
  console.log(`\nEmails: ${emailCount[0].count}`);

  // Count by type
  const receivedCount = await db.select({ count: sql<number>`count(*)` }).from(emails).where(sql`type = 'received'`);
  const sentCount = await db.select({ count: sql<number>`count(*)` }).from(emails).where(sql`type = 'sent'`);
  console.log(`  - Received: ${receivedCount[0].count}`);
  console.log(`  - Sent: ${sentCount[0].count}`);

  // Show sample emails
  const sampleEmails = await db.select().from(emails).limit(5);
  if (sampleEmails.length > 0) {
    console.log('\nSample emails:');
    sampleEmails.forEach(e => {
      console.log(`  - ${e.subject} (${e.from})`);
    });
  }

  console.log('\nDatabase URL:', process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bausmail');
}

checkDatabase().catch(console.error);
