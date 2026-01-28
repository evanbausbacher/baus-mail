import type { Email } from '@/types/email';
import { parseEmailAddress } from '@/lib/utils/email-helpers';

export type ComposeMode = 'new' | 'reply' | 'forward';

export interface ComposeDraft {
  mode: ComposeMode;
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  text?: string;
  html?: string;
  inReplyTo?: string | null;
  references?: string | null;
}

function uniqEmails(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function prefixSubject(prefix: string, subject: string): string {
  const s = subject.trim();
  const re = new RegExp(`^${prefix}\\s*`, 'i');
  return re.test(s) ? s : `${prefix} ${s}`.trim();
}

function quoteBody(email: Email): string {
  const date = email.createdAt instanceof Date ? email.createdAt : new Date(email.createdAt);
  const header = `On ${date.toLocaleString()}, ${email.from} wrote:`;
  const body = email.text?.trim() ? email.text.trim() : '';
  const quoted = body ? body.split('\n').map((l) => `> ${l}`).join('\n') : '> (No content)';
  return `${header}\n${quoted}\n`;
}

export function buildDraftFromEmail(mode: Exclude<ComposeMode, 'new'>, email: Email): ComposeDraft {
  if (mode === 'reply') {
    const subject = prefixSubject('Re:', email.subject || '');
    const inReplyTo = email.messageId ?? null;
    const references = uniqEmails([email.references ?? '', email.messageId ?? ''].join(' ').split(/\s+/g))
      .filter(Boolean)
      .join(' ') || null;

    return {
      mode,
      to: [parseEmailAddress(email.from).address],
      subject,
      text: `\n\n${quoteBody(email)}`,
      inReplyTo,
      references,
    };
  }

  const subject = prefixSubject('Fwd:', email.subject || '');
  return {
    mode,
    subject,
    text:
      `\n\n---------- Forwarded message ----------\n` +
      `From: ${email.from}\n` +
      `To: ${(email.to || []).join(', ')}\n` +
      `Subject: ${email.subject || ''}\n` +
      `Date: ${new Date(email.createdAt).toLocaleString()}\n\n` +
      `${email.text || ''}\n`,
  };
}
