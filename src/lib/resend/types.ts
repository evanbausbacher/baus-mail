// Resend API types based on API documentation

export interface ResendEmail {
  id: string;
  object: 'email';
  from: string;
  to: string[];
  created_at: string;
  subject: string;
  html?: string | null;
  text?: string | null;
  headers?: Record<string, string> | null;
  bcc?: string[] | null;
  cc?: string[] | null;
  reply_to?: string[] | null;
  last_event?: string;
  scheduled_at?: string | null;
}

export interface ResendReceivedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html?: string | null;
  text?: string | null;
  headers?: Record<string, string> | null;
  bcc?: string[];
  cc?: string[];
  reply_to?: string[];
  created_at: string;
  message_id?: string;
  attachments?: ResendAttachment[];
}

export interface ResendAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  content_id?: string | null;
  content_disposition?: string;
}

export interface ResendListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
}

export interface ResendSendEmailRequest {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  bcc?: string[];
  cc?: string[];
  reply_to?: string[];
  headers?: Record<string, string>;
  attachments?: {
    filename: string;
    content?: string;
    path?: string;
  }[];
}

export interface ResendSendEmailResponse {
  id: string;
  from?: string;
  to?: string[];
  created_at?: string;
}

export interface ResendError {
  name: string;
  message: string;
  statusCode: number;
}
