import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Domains table
export const domains = sqliteTable('domains', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // e.g., "trainingdojo.app"
  apiKey: text('api_key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
}, (table) => ({
  nameIdx: index('name_idx').on(table.name),
}));

// Emails table (unified for sent and received)
export const emails = sqliteTable('emails', {
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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),

  // Local metadata
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  isStarred: integer('is_starred', { mode: 'boolean' }).notNull().default(false),
  isSpam: integer('is_spam', { mode: 'boolean' }).notNull().default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),

  // Tags/labels
  labels: text('labels'), // JSON array string
}, (table) => ({
  domainIdx: index('domain_idx').on(table.domainId),
  typeIdx: index('type_idx').on(table.type),
  threadIdx: index('thread_idx').on(table.threadId),
  messageIdIdx: index('message_id_idx').on(table.messageId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  isDeletedIdx: index('is_deleted_idx').on(table.isDeleted),
}));

// Sync state tracking (prevents duplicate syncs)
export const syncState = sqliteTable('sync_state', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  domainId: text('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['sent', 'received'] }).notNull(),
  lastCursor: text('last_cursor'), // Pagination cursor from Resend
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  domainTypeIdx: index('domain_type_idx').on(table.domainId, table.type),
}));
