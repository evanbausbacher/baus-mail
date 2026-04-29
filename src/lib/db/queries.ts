import { eq, and, or, desc, sql, inArray, lt } from "drizzle-orm";
import { db } from "./index";
import { domains, emails, folders, syncState } from "./schema";
import type { Domain, CreateDomainInput, UpdateDomainInput } from "@/types/domain";
import type { Email, EmailType } from "@/types/email";
import type { MailFolder } from "@/types/folder";

type DomainRow = typeof domains.$inferSelect;
type EmailRow = typeof emails.$inferSelect;
type EmailInsertRow = typeof emails.$inferInsert;
type FolderRow = typeof folders.$inferSelect;

// ============================================
// Domain Queries
// ============================================

export async function getAllDomains(): Promise<Domain[]> {
  const result = await db.select().from(domains).orderBy(desc(domains.createdAt));
  return result.map(mapDomainFromDb);
}

export async function syncDomainsFromConfig(domainNames: string[]): Promise<Domain[]> {
  const configuredNames = new Set(domainNames.map((name) => name.trim().toLowerCase()).filter(Boolean));

  await db.transaction(async (tx) => {
    const existingDomains = await tx.select().from(domains);

    for (const domain of existingDomains) {
      if (!configuredNames.has(domain.name.toLowerCase())) {
        await tx.delete(emails).where(eq(emails.domainId, domain.id));
        await tx.delete(folders).where(eq(folders.domainId, domain.id));
        await tx.delete(syncState).where(eq(syncState.domainId, domain.id));
        await tx.delete(domains).where(eq(domains.id, domain.id));
      }
    }

    for (const name of configuredNames) {
      const exists = existingDomains.some((domain) => domain.name.toLowerCase() === name);
      if (!exists) {
        await tx.insert(domains).values({
          id: crypto.randomUUID(),
          name,
          createdAt: new Date(),
          isActive: true,
          isDefault: false,
          lastSyncedAt: null,
          iconUrl: null,
          fromAddresses: JSON.stringify(defaultFromAddresses(name)),
        });
      }
    }
  });

  return getAllDomains();
}

export async function getDomainById(id: string): Promise<Domain | null> {
  const result = await db.select().from(domains).where(eq(domains.id, id)).limit(1);
  return result.length > 0 ? mapDomainFromDb(result[0]) : null;
}

export async function getDomainByName(name: string): Promise<Domain | null> {
  const result = await db.select().from(domains).where(eq(domains.name, name)).limit(1);
  return result.length > 0 ? mapDomainFromDb(result[0]) : null;
}

export async function getDomainByRecipientAddresses(recipients: string[]): Promise<Domain | null> {
  const recipientDomains = new Set(
    recipients
      .map(extractEmailAddress)
      .map((email) => email.split("@")[1]?.toLowerCase())
      .filter((domain): domain is string => Boolean(domain))
  );

  if (recipientDomains.size === 0) return null;

  const allDomains = await getAllDomains();
  return allDomains.find((domain) => recipientDomains.has(domain.name.toLowerCase())) ?? null;
}

export async function getDomainBySenderAddress(sender: string): Promise<Domain | null> {
  const senderDomain = extractEmailAddress(sender).split("@")[1]?.toLowerCase();
  if (!senderDomain) return null;

  const allDomains = await getAllDomains();
  return allDomains.find((domain) => domain.name.toLowerCase() === senderDomain) ?? null;
}

export async function createDomain(input: CreateDomainInput): Promise<Domain> {
  const newDomain = {
    id: crypto.randomUUID(),
    name: input.name,
    createdAt: new Date(),
    isActive: true,
    isDefault: false,
    lastSyncedAt: null,
    iconUrl: null,
    fromAddresses: defaultFromAddresses(input.name),
  };

  await db.insert(domains).values({
    id: newDomain.id,
    name: newDomain.name,
    createdAt: newDomain.createdAt,
    isActive: true,
    isDefault: false,
    lastSyncedAt: null,
    iconUrl: null,
    fromAddresses: JSON.stringify(newDomain.fromAddresses),
  });

  return newDomain;
}

export async function updateDomain(id: string, input: UpdateDomainInput): Promise<Domain | null> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.isDefault !== undefined) updates.isDefault = input.isDefault;
  if (input.iconUrl !== undefined) updates.iconUrl = input.iconUrl;
  if (input.fromAddresses !== undefined) updates.fromAddresses = JSON.stringify(normalizeFromAddresses(input.fromAddresses));

  if (Object.keys(updates).length === 0) {
    return getDomainById(id);
  }

  await db.transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.update(domains).set({ isDefault: false });
    }
    await tx.update(domains).set(updates).where(eq(domains.id, id));
  });
  return getDomainById(id);
}

export async function deleteDomain(id: string): Promise<boolean> {
  await db.transaction(async (tx) => {
    await tx.delete(emails).where(eq(emails.domainId, id));
    await tx.delete(folders).where(eq(folders.domainId, id));
    await tx.delete(syncState).where(eq(syncState.domainId, id));
    await tx.delete(domains).where(eq(domains.id, id));
  });

  return true;
}

export async function updateDomainLastSynced(id: string): Promise<void> {
  await db.update(domains).set({ lastSyncedAt: new Date() }).where(eq(domains.id, id));
}

// ============================================
// Folder Queries
// ============================================

export async function getFoldersByDomain(domainId: string): Promise<MailFolder[]> {
  const result = await db
    .select()
    .from(folders)
    .where(eq(folders.domainId, domainId))
    .orderBy(folders.name);

  return result.map(mapFolderFromDb);
}

export async function getFolderById(id: string): Promise<MailFolder | null> {
  const result = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
  return result.length > 0 ? mapFolderFromDb(result[0]) : null;
}

export async function createFolder(input: { domainId: string; name: string }): Promise<MailFolder> {
  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(folders).values({
    id,
    domainId: input.domainId,
    name: input.name.trim(),
    createdAt: now,
    updatedAt: now,
  });

  const folder = await getFolderById(id);
  if (!folder) throw new Error("Failed to create folder");
  return folder;
}

export async function updateFolder(id: string, input: { name: string }): Promise<MailFolder | null> {
  await db
    .update(folders)
    .set({ name: input.name.trim(), updatedAt: new Date() })
    .where(eq(folders.id, id));

  return getFolderById(id);
}

export async function deleteFolder(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(emails)
      .set({ folderId: null })
      .where(
        and(
          eq(emails.folderId, id),
          eq(emails.isSpam, false),
          eq(emails.isDeleted, false),
          eq(emails.isArchived, false)
        )
      );
    await tx.delete(folders).where(eq(folders.id, id));
  });
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
    cursor?: Date;
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
        options?.cursor ? lt(emails.createdAt, options.cursor) : undefined,
        !options?.includeDeleted ? eq(emails.isDeleted, false) : undefined
      )
    )
    .orderBy(desc(emails.createdAt))
    .limit(limit)
    .offset(offset);

  const result = await query;
  return result.map(mapEmailFromDb);
}

export async function getEmailContentState(emailIds: string[]): Promise<Map<string, boolean>> {
  if (emailIds.length === 0) return new Map();

  const result = await db
    .select({
      id: emails.id,
      html: emails.html,
      text: emails.text,
    })
    .from(emails)
    .where(inArray(emails.id, emailIds));

  return new Map(
    result.map((row) => [
      row.id,
      Boolean(row.html?.trim() || row.text?.trim()),
    ])
  );
}

export async function getEmailById(id: string): Promise<Email | null> {
  const result = await db.select().from(emails).where(eq(emails.id, id)).limit(1);
  return result.length > 0 ? mapEmailFromDb(result[0]) : null;
}

export async function searchEmails(params: {
  domainId: string;
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    type?: EmailType;
    isRead?: boolean;
    isStarred?: boolean;
    isSpam?: boolean;
    isDeleted?: boolean;
    isArchived?: boolean;
    folderId?: string | null;
    from?: string;
    to?: string;
    subject?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}): Promise<Email[]> {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;

  const q = params.query.trim().toLowerCase();
  const likeQ = `%${q}%`;

  const textMatch = or(
    sql`lower(${emails.subject}) like ${likeQ}`,
    sql`lower(${emails.from}) like ${likeQ}`,
    sql`lower(${emails.to}) like ${likeQ}`,
    sql`lower(${emails.text}) like ${likeQ}`,
    sql`lower(${emails.html}) like ${likeQ}`
  );

  const f = params.filters;
  const fromLike = f?.from ? `%${f.from.toLowerCase()}%` : null;
  const toLike = f?.to ? `%${f.to.toLowerCase()}%` : null;
  const subjectLike = f?.subject ? `%${f.subject.toLowerCase()}%` : null;
  const dateFrom = f?.dateFrom ? new Date(f.dateFrom) : null;
  const dateTo = f?.dateTo ? new Date(f.dateTo) : null;

  const where = and(
    eq(emails.domainId, params.domainId),
    f?.type ? eq(emails.type, f.type) : undefined,
    f?.isRead !== undefined ? eq(emails.isRead, f.isRead) : undefined,
    f?.isStarred !== undefined ? eq(emails.isStarred, f.isStarred) : undefined,
    f?.isSpam !== undefined ? eq(emails.isSpam, f.isSpam) : undefined,
    f?.isDeleted !== undefined ? eq(emails.isDeleted, f.isDeleted) : undefined,
    f?.isArchived !== undefined ? eq(emails.isArchived, f.isArchived) : undefined,
    f?.folderId !== undefined && f.folderId !== null ? eq(emails.folderId, f.folderId) : undefined,
    fromLike ? sql`lower(${emails.from}) like ${fromLike}` : undefined,
    toLike ? sql`lower(${emails.to}) like ${toLike}` : undefined,
    subjectLike ? sql`lower(${emails.subject}) like ${subjectLike}` : undefined,
    dateFrom ? sql`${emails.createdAt} >= ${dateFrom}` : undefined,
    dateTo ? sql`${emails.createdAt} <= ${dateTo}` : undefined,
    textMatch
  );

  const result = await db
    .select()
    .from(emails)
    .where(where)
    .orderBy(desc(emails.createdAt))
    .limit(limit)
    .offset(offset);

  return result.map(mapEmailFromDb);
}

export async function createEmail(email: Omit<Email, "syncedAt">): Promise<Email> {
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
    isArchived: email.isArchived,
    folderId: email.folderId ?? null,
    labels: email.labels ? JSON.stringify(email.labels) : null,
  });

  return { ...email, syncedAt: new Date() };
}

export async function upsertEmailRemote(email: Omit<Email, "syncedAt">): Promise<void> {
  const now = new Date();

  const insertValues: EmailInsertRow = {
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
    syncedAt: now,
    isRead: email.isRead,
    isStarred: email.isStarred,
    isSpam: email.isSpam,
    isDeleted: email.isDeleted,
    isArchived: email.isArchived,
    folderId: email.folderId ?? null,
    labels: email.labels ? JSON.stringify(email.labels) : null,
  };

  const updateValues: Partial<EmailInsertRow> = {
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
    syncedAt: now,
  };

  await db
    .insert(emails)
    .values(insertValues)
    .onConflictDoUpdate({
      target: emails.id,
      set: updateValues,
    });
}

export async function upsertEmailRemotes(emailList: Array<Omit<Email, "syncedAt">>): Promise<void> {
  if (emailList.length === 0) return;

  const now = new Date();
  const rows: EmailInsertRow[] = emailList.map((email) => ({
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
    syncedAt: now,
    isRead: email.isRead,
    isStarred: email.isStarred,
    isSpam: email.isSpam,
    isDeleted: email.isDeleted,
    isArchived: email.isArchived,
    folderId: email.folderId ?? null,
    labels: email.labels ? JSON.stringify(email.labels) : null,
  }));

  await db
    .insert(emails)
    .values(rows)
    .onConflictDoUpdate({
      target: emails.id,
      set: {
        messageId: sql`excluded.message_id`,
        from: sql`excluded."from"`,
        to: sql`excluded."to"`,
        cc: sql`excluded.cc`,
        bcc: sql`excluded.bcc`,
        replyTo: sql`excluded.reply_to`,
        subject: sql`excluded.subject`,
        html: sql`excluded.html`,
        text: sql`excluded.text`,
        headers: sql`excluded.headers`,
        attachments: sql`excluded.attachments`,
        inReplyTo: sql`excluded.in_reply_to`,
        references: sql`excluded.references`,
        threadId: sql`excluded.thread_id`,
        createdAt: sql`excluded.created_at`,
        syncedAt: now,
      },
    });
}

export async function updateEmailFlags(
  emailIds: string[],
  flags: {
    isRead?: boolean;
    isStarred?: boolean;
    isSpam?: boolean;
    isDeleted?: boolean;
    isArchived?: boolean;
    folderId?: string | null;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (flags.isRead !== undefined) updates.isRead = flags.isRead;
  if (flags.isStarred !== undefined) updates.isStarred = flags.isStarred;
  if (flags.isSpam !== undefined) updates.isSpam = flags.isSpam;
  if (flags.isDeleted !== undefined) updates.isDeleted = flags.isDeleted;
  if (flags.isArchived !== undefined) updates.isArchived = flags.isArchived;
  if (flags.folderId !== undefined) updates.folderId = flags.folderId;

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
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return new Date(String(value));
  };

  return {
    id: row.id,
    name: row.name,
    createdAt: toDate(row.createdAt),
    isActive: Boolean(row.isActive),
    isDefault: Boolean(row.isDefault),
    lastSyncedAt: row.lastSyncedAt ? toDate(row.lastSyncedAt) : null,
    iconUrl: row.iconUrl,
    fromAddresses: parseFromAddresses(row.fromAddresses, row.name),
  };
}

function mapFolderFromDb(row: FolderRow): MailFolder {
  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return new Date(value);
    return new Date(String(value));
  };

  return {
    id: row.id,
    domainId: row.domainId,
    name: row.name,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function mapEmailFromDb(row: EmailRow): Email {
  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") return new Date(value);
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
    isArchived: Boolean(row.isArchived),
    folderId: row.folderId,
    labels: row.labels ? JSON.parse(row.labels) : null,
  };
}

function extractEmailAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

function defaultFromAddresses(domainName: string): string[] {
  return ["support", "no-reply", "admin"].map((local) => `${local}@${domainName}`);
}

function normalizeFromAddresses(addresses: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const address of addresses) {
    const normalized = address.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function parseFromAddresses(value: string | null, domainName: string): string[] {
  if (!value) return defaultFromAddresses(domainName);
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return defaultFromAddresses(domainName);
    const normalized = normalizeFromAddresses(parsed.filter((item): item is string => typeof item === "string"));
    return normalized.length > 0 ? normalized : defaultFromAddresses(domainName);
  } catch {
    return defaultFromAddresses(domainName);
  }
}
