export type EmailType = 'sent' | 'received';

export interface Email {
  id: string;
  domainId: string;
  type: EmailType;
  messageId?: string | null;
  from: string;
  to: string[]; // Parsed from JSON
  cc?: string[] | null;
  bcc?: string[] | null;
  replyTo?: string[] | null;
  subject: string;
  html?: string | null;
  text?: string | null;
  headers?: Record<string, string> | null;
  attachments?: EmailAttachment[] | null;
  inReplyTo?: string | null;
  references?: string | null;
  threadId?: string | null;
  createdAt: Date;
  syncedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  isSpam: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  folderId?: string | null;
  labels?: string[] | null;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  contentId?: string | null;
  contentDisposition?: string | null;
}

export interface SendEmailInput {
  domainId: string;
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  inReplyTo?: string; // For threading
  references?: string; // For threading
  attachments?: EmailAttachment[];
}

export interface EmailThread {
  id: string;
  emails: Email[];
  subject: string;
  latestDate: Date;
  unreadCount: number;
}

export interface EmailFilters {
  type?: EmailType;
  isRead?: boolean;
  isStarred?: boolean;
  isSpam?: boolean;
  isDeleted?: boolean;
  isArchived?: boolean;
  folderId?: string | null;
  search?: string;
}
