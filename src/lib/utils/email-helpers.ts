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
  const content = text || stripHtml(html || '');
  if (!content) return 'No content';

  const preview = content.replace(/\s+/g, ' ').trim();
  return preview.length > maxLength
    ? preview.substring(0, maxLength) + '...'
    : preview;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
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
