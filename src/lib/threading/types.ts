import { Email } from '@/types/email';

export interface ThreadEmail extends Email {
  depth: number; // Nesting level in the thread
  position: number; // Position within the thread
}

export interface EmailThread {
  id: string; // Thread ID (root message-id or computed)
  subject: string; // Normalized subject (without Re:/Fwd:)
  emails: ThreadEmail[];
  rootEmail: ThreadEmail;
  latestEmail: ThreadEmail;
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
