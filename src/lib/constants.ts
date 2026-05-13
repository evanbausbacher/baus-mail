// Application constants

export const RESEND_API_BASE_URL = 'https://api.resend.com';

export const EMAIL_PAGINATION_LIMIT = 100; // Resend API max limit

export const RESEND_CONCURRENT_REQUESTS = Number(process.env.RESEND_CONCURRENT_REQUESTS) || 2;

export const EMAIL_FILTERS = {
  INBOX: 'inbox',
  SENT: 'sent',
  STARRED: 'starred',
  SPAM: 'spam',
  TRASH: 'trash',
} as const;

export const EMAIL_ACTIONS = {
  DELETE: 'delete',
  STAR: 'star',
  UNSTAR: 'unstar',
  MARK_READ: 'markRead',
  MARK_UNREAD: 'markUnread',
  SPAM: 'spam',
  NOT_SPAM: 'notSpam',
} as const;
