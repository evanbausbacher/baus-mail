import type { Email, EmailSummary } from '@/types/email';

export type ThreadableEmail = Email | EmailSummary;

export type ThreadEmail<T extends ThreadableEmail = Email> = T & {
  depth: number; // Nesting level in the thread
  position: number; // Position within the thread
};

export interface EmailThread<T extends ThreadableEmail = Email> {
  id: string; // Thread ID (root message-id or computed)
  subject: string; // Normalized subject (without Re:/Fwd:)
  emails: ThreadEmail<T>[];
  rootEmail: ThreadEmail<T>;
  latestEmail: ThreadEmail<T>;
  participantCount: number;
  unreadCount: number;
  hasStarred: boolean;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface ThreadBuildOptions {
  sortOrder?: 'asc' | 'desc'; // Sort threads by date
  includeDeleted?: boolean;
  includeSpam?: boolean;
}
