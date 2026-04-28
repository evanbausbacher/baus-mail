import { boolean, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Domains table
export const domains = pgTable('domains', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // e.g., "trainingdojo.app"
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()),
  isActive: boolean('is_active').notNull().default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  iconUrl: text('icon_url'),
}, (table) => ({
  nameIdx: index('name_idx').on(table.name),
}));

export const folders = pgTable('folders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  domainId: text('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$defaultFn(() => new Date()),
}, (table) => ({
  domainIdx: index('folders_domain_idx').on(table.domainId),
  domainNameUniqueIdx: uniqueIndex('folders_domain_name_unique_idx').on(table.domainId, table.name),
}));

// Emails table (unified for sent and received)
export const emails = pgTable('emails', {
  id: text('id').primaryKey(), // Resend email ID
  domainId: text('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),

  // Email metadata
  type: text('type', { enum: ['sent', 'received'] }).notNull(),
  messageId: text('message_id'), // Email message-id header

  // Email content
  from: text('from').notNull(),
  to: text('to').notNull(), // JSON array string
  cc: text('cc'), // JSON array string
  bcc: text('bcc'), // JSON array string
  replyTo: text('reply_to'), // JSON array string
  subject: text('subject').notNull(),
  html: text('html'),
  text: text('text'),
  headers: text('headers'), // JSON object string

  // Attachments
  attachments: text('attachments'), // JSON array string

  // Threading
  inReplyTo: text('in_reply_to'), // Message-ID this email replies to
  references: text('references'), // Space-separated Message-IDs
  threadId: text('thread_id'), // Computed thread identifier

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).$defaultFn(() => new Date()),

  // Local metadata
  isRead: boolean('is_read').notNull().default(false),
  isStarred: boolean('is_starred').notNull().default(false),
  isSpam: boolean('is_spam').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),

  // Tags/labels
  labels: text('labels'), // JSON array string
}, (table) => ({
  domainTypeCreatedIdx: index('emails_domain_type_created_idx').on(table.domainId, table.type, table.createdAt),
  domainIdx: index('domain_idx').on(table.domainId),
  typeIdx: index('type_idx').on(table.type),
  threadIdx: index('thread_idx').on(table.threadId),
  messageIdIdx: index('message_id_idx').on(table.messageId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  isDeletedIdx: index('is_deleted_idx').on(table.isDeleted),
  isArchivedIdx: index('is_archived_idx').on(table.isArchived),
  folderIdx: index('folder_idx').on(table.folderId),
}));

// Sync state tracking (stores newest known Resend email ID per domain/type)
export const syncState = pgTable('sync_state', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  domainId: text('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['sent', 'received'] }).notNull(),
  lastCursor: text('last_cursor'), // Newest known Resend email ID
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).$defaultFn(() => new Date()),
}, (table) => ({
  domainTypeIdx: index('domain_type_idx').on(table.domainId, table.type),
}));
