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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      results[current] = await mapper(items[current]);
    }
  });

  await Promise.all(workers);
  return results;
}

// ============================================
// Resend API Client
// ============================================

export class ResendClient {
  private apiKey: string;
  private requestQueue: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;
  private minIntervalMs = 550; // ~2 req/sec with buffer

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async sleep(ms: number) {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = async () => {
      const now = Date.now();
      const wait = Math.max(0, this.minIntervalMs - (now - this.lastRequestAt));
      if (wait > 0) await this.sleep(wait);
      const result = await fn();
      this.lastRequestAt = Date.now();
      return result;
    };

    const p = this.requestQueue.then(run);
    this.requestQueue = p.then(() => undefined, () => undefined);
    return p;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${RESEND_API_BASE_URL}${endpoint}`;

    return this.enqueue(async () => {
      let attempt = 0;
      const maxAttempts = 5;

      while (true) {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.status === 429 && attempt < maxAttempts - 1) {
          attempt++;
          const retryAfterHeader = response.headers.get('retry-after');
          const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
          const retryAfterMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 1000;
          await this.sleep(Math.min(10_000, retryAfterMs));
          continue;
        }

        if (!response.ok) {
          const error: ResendError = await response.json();
          throw new Error(`Resend API Error: ${error.message}`);
        }

        return response.json();
      }
    });
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
    } catch {
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

  // The list endpoint often returns references; retrieve each email for body content.
  const full = await mapWithConcurrency(
    response.data,
    2,
    async (e) => client.getReceivedEmail(e.id)
  );

  const emails: Email[] = full.map((resendEmail) => mapResendReceivedEmailToEmail(resendEmail, domainId));

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

  // The list endpoint returns references; retrieve each email for body content.
  const full = await mapWithConcurrency(
    response.data,
    2,
    async (e) => client.getSentEmail(e.id)
  );

  const emails: Email[] = full.map((resendEmail) => mapResendSentEmailToEmail(resendEmail, domainId));

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
    attachments: resendEmail.attachments
      ? resendEmail.attachments.map((a) => ({
          id: a.id,
          filename: a.filename,
          contentType: a.content_type,
          size: a.size,
          contentId: a.content_id ?? null,
          contentDisposition: a.content_disposition ?? null,
        }))
      : null,
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
