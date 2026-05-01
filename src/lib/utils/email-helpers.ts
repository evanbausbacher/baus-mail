import type { Email } from '@/types/email';

// Email parsing and formatting utilities

export function parseEmailAddress(email: string): { name?: string; address: string } {
  const match = email.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: match[1]?.trim(),
      address: match[2].trim(),
    };
  }
  return { address: email.trim() };
}

export function formatEmailAddress(email: string): string {
  const parsed = parseEmailAddress(email);
  return parsed.name ? `${parsed.name}` : parsed.address;
}

export function getEmailPreview(text: string | null, html: string | null, maxLength: number = 100): string {
  const content = splitReplyContent(text || stripHtml(html || '')).body || text || stripHtml(html || '');
  if (!content) return 'No content';

  const preview = content.replace(/\s+/g, ' ').trim();
  return preview.length > maxLength
    ? preview.substring(0, maxLength) + '...'
    : preview;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|section|article|tr|table|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeBodyForLlm(email: Email): string {
  const text = email.text?.trim();
  if (text) return text.replace(/\r\n?/g, '\n');

  const stripped = stripHtml(email.html ?? '');
  return stripped ? stripped.replace(/\r\n?/g, '\n') : 'No content';
}

function formatMarkdownList(label: string, value: string): string {
  return `- **${label}:** ${value}`;
}

function formatThreadSubject(subject?: string | null): string {
  const normalized = subject?.trim();
  return normalized ? normalized : '(No subject)';
}

export function formatEmailThreadForLlm(threadEmails: Email[], subject?: string): string {
  const sorted = [...threadEmails].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const title = formatThreadSubject(subject ?? sorted[0]?.subject);
  if (!sorted.length) return `# Email Thread: ${title}`;

  const sections = sorted.map((email, index) => {
    const lines = [
      `## Message ${index + 1}`,
      '',
      formatMarkdownList('From', email.from),
      formatMarkdownList('To', email.to?.length ? email.to.join(', ') : '(none)'),
      ...(email.cc?.length ? [formatMarkdownList('Cc', email.cc.join(', '))] : []),
      formatMarkdownList('Date', email.createdAt.toISOString()),
      formatMarkdownList('Type', email.type),
      '',
      '### Body',
      '',
      '````text',
      normalizeBodyForLlm(email),
      '````',
    ];

    return lines.join('\n');
  });

  return `# Email Thread: ${title}\n\n${sections.join('\n\n---\n\n')}`;
}

export interface ReplyContentParts {
  body: string;
  quotedHeader: string | null;
  quotedBody: string | null;
}

export function splitReplyContent(content: string | null | undefined): ReplyContentParts {
  const normalized = (content ?? '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return { body: '', quotedHeader: null, quotedBody: null };

  const lines = normalized.split('\n');
  const headerIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return /^On .+ wrote:$/i.test(trimmed) || /^-{2,}\s*Forwarded message\s*-{2,}$/i.test(trimmed);
  });

  if (headerIndex >= 0) {
    return {
      body: lines.slice(0, headerIndex).join('\n').trim(),
      quotedHeader: lines[headerIndex].trim(),
      quotedBody: cleanQuotedText(lines.slice(headerIndex + 1).join('\n')),
    };
  }

  const firstQuotedLine = lines.findIndex((line) => /^>\s?/.test(line));
  if (firstQuotedLine > 0) {
    return {
      body: lines.slice(0, firstQuotedLine).join('\n').trim(),
      quotedHeader: null,
      quotedBody: cleanQuotedText(lines.slice(firstQuotedLine).join('\n')),
    };
  }

  return { body: normalized, quotedHeader: null, quotedBody: null };
}

function cleanQuotedText(value: string): string {
  return value
    .split('\n')
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(Re|Fwd|Fw):\s*/gi, '')
    .trim();
}

export function isReply(subject: string): boolean {
  return /^Re:/i.test(subject);
}

export function isForward(subject: string): boolean {
  return /^(Fwd|Fw):/i.test(subject);
}

export function extractDomain(email: string): string {
  const parsed = parseEmailAddress(email);
  const match = parsed.address.match(/@(.+)$/);
  return match ? match[1] : '';
}

export function parseEmailList(emailsJson: string | null): string[] {
  if (!emailsJson) return [];
  try {
    const parsed = JSON.parse(emailsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function stringifyEmailList(emails: string[]): string {
  return JSON.stringify(emails);
}
