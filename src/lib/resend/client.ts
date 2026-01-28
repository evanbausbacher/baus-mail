import { RESEND_API_BASE_URL, EMAIL_PAGINATION_LIMIT } from '../constants';
import type {
  ResendEmail,
  ResendReceivedEmail,
  ResendListResponse,
  ResendSendEmailRequest,
  ResendSendEmailResponse,
  ResendError,
} from './types';
import type { Email } from '@/types/email';

// ============================================
// Resend API Client
// ============================================

export class ResendClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${RESEND_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ResendError = await response.json();
      throw new Error(`Resend API Error: ${error.message}`);
    }

    return response.json();
  }

  // ============================================
  // Received Emails
  // ============================================

  async listReceivedEmails(options?: {
    limit?: number;
    after?: string;
    before?: string;
  }): Promise<ResendListResponse<ResendReceivedEmail>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.after) params.append('after', options.after);
    if (options?.before) params.append('before', options.before);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<ResendListResponse<ResendReceivedEmail>>(
      `/emails/receiving${query}`
    );
  }

  async getReceivedEmail(emailId: string): Promise<ResendReceivedEmail> {
    return this.request<ResendReceivedEmail>(`/emails/receiving/${emailId}`);
  }

  // ============================================
  // Sent Emails
  // ============================================

  async listSentEmails(options?: {
    limit?: number;
    after?: string;
    before?: string;
  }): Promise<ResendListResponse<ResendEmail>> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.after) params.append('after', options.after);
    if (options?.before) params.append('before', options.before);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<ResendListResponse<ResendEmail>>(`/emails${query}`);
  }

  async getSentEmail(emailId: string): Promise<ResendEmail> {
    return this.request<ResendEmail>(`/emails/${emailId}`);
  }

  // ============================================
  // Send Email
  // ============================================

  async sendEmail(
    data: ResendSendEmailRequest
  ): Promise<ResendSendEmailResponse> {
    return this.request<ResendSendEmailResponse>('/emails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Validation
  // ============================================

  async validateApiKey(): Promise<boolean> {
    try {
      // Try to list emails with limit 1 to validate API key
      await this.listReceivedEmails({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// ============================================
// Sync Functions
// ============================================

export async function syncReceivedEmails(
  apiKey: string,
  domainId: string,
  lastCursor?: string | null
): Promise<{ emails: Email[]; nextCursor: string | null; hasMore: boolean }> {
  const client = new ResendClient(apiKey);
  const response = await client.listReceivedEmails({
    limit: EMAIL_PAGINATION_LIMIT,
    after: lastCursor || undefined,
  });

  const emails: Email[] = response.data.map((resendEmail) =>
    mapResendReceivedEmailToEmail(resendEmail, domainId)
  );

  // Get next cursor (last email ID if has_more)
  const nextCursor = response.has_more && emails.length > 0
    ? emails[emails.length - 1].id
    : null;

  return {
    emails,
    nextCursor,
    hasMore: response.has_more,
  };
}

export async function syncSentEmails(
  apiKey: string,
  domainId: string,
  lastCursor?: string | null
): Promise<{ emails: Email[]; nextCursor: string | null; hasMore: boolean }> {
  const client = new ResendClient(apiKey);
  const response = await client.listSentEmails({
    limit: EMAIL_PAGINATION_LIMIT,
    after: lastCursor || undefined,
  });

  const emails: Email[] = response.data.map((resendEmail) =>
    mapResendSentEmailToEmail(resendEmail, domainId)
  );

  // Get next cursor (last email ID if has_more)
  const nextCursor = response.has_more && emails.length > 0
    ? emails[emails.length - 1].id
    : null;

  return {
    emails,
    nextCursor,
    hasMore: response.has_more,
  };
}

// ============================================
// Mapping Functions
// ============================================

function mapResendReceivedEmailToEmail(
  resendEmail: ResendReceivedEmail,
  domainId: string
): Email {
  return {
    id: resendEmail.id,
    domainId,
    type: 'received',
    messageId: resendEmail.message_id || null,
    from: resendEmail.from,
    to: resendEmail.to,
    cc: resendEmail.cc || null,
    bcc: resendEmail.bcc || null,
    replyTo: resendEmail.reply_to || null,
    subject: resendEmail.subject,
    html: resendEmail.html || null,
    text: resendEmail.text || null,
    headers: null,
    attachments: resendEmail.attachments || null,
    inReplyTo: null, // TODO: Extract from headers if available
    references: null, // TODO: Extract from headers if available
    threadId: resendEmail.message_id || null, // Use message_id as initial thread ID
    createdAt: new Date(resendEmail.created_at),
    syncedAt: new Date(),
    isRead: false,
    isStarred: false,
    isSpam: false,
    isDeleted: false,
    labels: null,
  };
}

function mapResendSentEmailToEmail(
  resendEmail: ResendEmail,
  domainId: string
): Email {
  return {
    id: resendEmail.id,
    domainId,
    type: 'sent',
    messageId: null, // Sent emails don't have message_id in list response
    from: resendEmail.from,
    to: resendEmail.to,
    cc: resendEmail.cc || null,
    bcc: resendEmail.bcc || null,
    replyTo: resendEmail.reply_to || null,
    subject: resendEmail.subject,
    html: resendEmail.html || null,
    text: resendEmail.text || null,
    headers: null,
    attachments: null,
    inReplyTo: null,
    references: null,
    threadId: null,
    createdAt: new Date(resendEmail.created_at),
    syncedAt: new Date(),
    isRead: true, // Sent emails are always "read"
    isStarred: false,
    isSpam: false,
    isDeleted: false,
    labels: null,
  };
}
