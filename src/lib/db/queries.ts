import { eq, and, desc } from 'drizzle-orm';
import { db } from './index';
import { domains, emails, syncState } from './schema';
import type { Domain, CreateDomainInput, UpdateDomainInput } from '@/types/domain';
import type { Email, EmailType } from '@/types/email';

type DomainRow = typeof domains.$inferSelect;
type EmailRow = typeof emails.$inferSelect;

// ============================================
// Domain Queries
// ============================================

export async function getAllDomains(): Promise<Domain[]> {
  const result = await db.select().from(domains).orderBy(desc(domains.createdAt));
  return result.map(mapDomainFromDb);
}

export async function getDomainById(id: string): Promise<Domain | null> {
  const result = await db.select().from(domains).where(eq(domains.id, id)).limit(1);
  return result.length > 0 ? mapDomainFromDb(result[0]) : null;
}

export async function getDomainByName(name: string): Promise<Domain | null> {
  const result = await db.select().from(domains).where(eq(domains.name, name)).limit(1);
  return result.length > 0 ? mapDomainFromDb(result[0]) : null;
}

export async function createDomain(input: CreateDomainInput): Promise<Domain> {
  const newDomain = {
    id: crypto.randomUUID(),
    name: input.name,
    apiKey: input.apiKey,
    createdAt: new Date(),
    isActive: true,
    lastSyncedAt: null,
  };

  await db.insert(domains).values({
    id: newDomain.id,
    name: newDomain.name,
    apiKey: newDomain.apiKey,
    createdAt: newDomain.createdAt,
    isActive: true,
    lastSyncedAt: null,
  });

  return newDomain;
}

export async function updateDomain(id: string, input: UpdateDomainInput): Promise<Domain | null> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.apiKey !== undefined) updates.apiKey = input.apiKey;
  if (input.isActive !== undefined) updates.isActive = input.isActive;

  if (Object.keys(updates).length === 0) {
    return getDomainById(id);
  }

  await db.update(domains).set(updates).where(eq(domains.id, id));
  return getDomainById(id);
}

export async function deleteDomain(id: string): Promise<boolean> {
  await db.delete(domains).where(eq(domains.id, id));
  return true;
}

export async function updateDomainLastSynced(id: string): Promise<void> {
  await db.update(domains).set({ lastSyncedAt: new Date() }).where(eq(domains.id, id));
}

// ============================================
// Email Queries
// ============================================

export async function getEmailsByDomain(
  domainId: string,
  type?: EmailType,
  options?: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }
): Promise<Email[]> {
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const query = db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.domainId, domainId),
        type ? eq(emails.type, type) : undefined,
        !options?.includeDeleted ? eq(emails.isDeleted, false) : undefined
      )
    )
    .orderBy(desc(emails.createdAt))
    .limit(limit)
    .offset(offset);

  const result = await query;
  return result.map(mapEmailFromDb);
}

export async function getEmailById(id: string): Promise<Email | null> {
  const result = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  return result.length > 0 ? mapEmailFromDb(result[0]) : null;
}

export async function createEmail(email: Omit<Email, 'syncedAt'>): Promise<Email> {
  await db.insert(emails).values({
    id: email.id,
    domainId: email.domainId,
    type: email.type,
    messageId: email.messageId || null,
    from: email.from,
    to: JSON.stringify(email.to),
    cc: email.cc ? JSON.stringify(email.cc) : null,
    bcc: email.bcc ? JSON.stringify(email.bcc) : null,
    replyTo: email.replyTo ? JSON.stringify(email.replyTo) : null,
    subject: email.subject,
    html: email.html || null,
    text: email.text || null,
    headers: email.headers ? JSON.stringify(email.headers) : null,
    attachments: email.attachments ? JSON.stringify(email.attachments) : null,
    inReplyTo: email.inReplyTo || null,
    references: email.references || null,
    threadId: email.threadId || null,
    createdAt: email.createdAt,
    syncedAt: new Date(),
    isRead: email.isRead,
    isStarred: email.isStarred,
    isSpam: email.isSpam,
    isDeleted: email.isDeleted,
    labels: email.labels ? JSON.stringify(email.labels) : null,
  });

  return { ...email, syncedAt: new Date() };
}

export async function updateEmailFlags(
  emailIds: string[],
  flags: {
    isRead?: boolean;
    isStarred?: boolean;
    isSpam?: boolean;
    isDeleted?: boolean;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (flags.isRead !== undefined) updates.isRead = flags.isRead;
  if (flags.isStarred !== undefined) updates.isStarred = flags.isStarred;
  if (flags.isSpam !== undefined) updates.isSpam = flags.isSpam;
  if (flags.isDeleted !== undefined) updates.isDeleted = flags.isDeleted;

  for (const emailId of emailIds) {
    await db.update(emails).set(updates).where(eq(emails.id, emailId));
  }
}

// ============================================
// Sync State Queries
// ============================================

export async function getSyncState(
  domainId: string,
  type: EmailType
): Promise<{ lastCursor: string | null; lastSyncedAt: Date | null } | null> {
  const result = await db
    .select()
    .from(syncState)
    .where(and(eq(syncState.domainId, domainId), eq(syncState.type, type)))
    .limit(1);

  if (result.length === 0) return null;

  return {
    lastCursor: result[0].lastCursor,
    lastSyncedAt: result[0].lastSyncedAt,
  };
}

export async function updateSyncState(
  domainId: string,
  type: EmailType,
  lastCursor: string | null
): Promise<void> {
  const existing = await getSyncState(domainId, type);

  if (existing) {
    await db
      .update(syncState)
      .set({
        lastCursor,
        lastSyncedAt: new Date(),
      })
      .where(and(eq(syncState.domainId, domainId), eq(syncState.type, type)));
  } else {
    await db.insert(syncState).values({
      id: crypto.randomUUID(),
      domainId,
      type,
      lastCursor,
      lastSyncedAt: new Date(),
    });
  }
}

// ============================================
// Helper Functions
// ============================================

function mapDomainFromDb(row: DomainRow): Domain {
  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date(String(value));
  };

  return {
    id: row.id,
    name: row.name,
    apiKey: row.apiKey,
    createdAt: toDate(row.createdAt),
    isActive: Boolean(row.isActive),
    lastSyncedAt: row.lastSyncedAt ? toDate(row.lastSyncedAt) : null,
  };
}

function mapEmailFromDb(row: EmailRow): Email {
  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date(String(value));
  };

  return {
    id: row.id,
    domainId: row.domainId,
    type: row.type as EmailType,
    messageId: row.messageId,
    from: row.from,
    to: JSON.parse(row.to),
    cc: row.cc ? JSON.parse(row.cc) : null,
    bcc: row.bcc ? JSON.parse(row.bcc) : null,
    replyTo: row.replyTo ? JSON.parse(row.replyTo) : null,
    subject: row.subject,
    html: row.html,
    text: row.text,
    headers: row.headers ? JSON.parse(row.headers) : null,
    attachments: row.attachments ? JSON.parse(row.attachments) : null,
    inReplyTo: row.inReplyTo,
    references: row.references,
    threadId: row.threadId,
    createdAt: toDate(row.createdAt),
    syncedAt: toDate(row.syncedAt),
    isRead: Boolean(row.isRead),
    isStarred: Boolean(row.isStarred),
    isSpam: Boolean(row.isSpam),
    isDeleted: Boolean(row.isDeleted),
    labels: row.labels ? JSON.parse(row.labels) : null,
  };
}
