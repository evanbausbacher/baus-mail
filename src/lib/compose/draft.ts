import type { Email } from '@/types/email';
import { parseEmailAddress, stripHtml } from '@/lib/utils/email-helpers';

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';

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
  const bodyText = email.text?.trim() || stripHtml(email.html ?? '');
  const body = bodyText.trim();
  const quoted = body ? body.split('\n').map((l) => `> ${l}`).join('\n') : '> (No content)';
  return `${header}\n${quoted}\n`;
}

export function buildDraftFromEmail(
  mode: Exclude<ComposeMode, 'new'>,
  email: Email,
  currentAddress?: string
): ComposeDraft {
  if (mode === 'reply' || mode === 'replyAll') {
    const subject = prefixSubject('Re:', email.subject || '');
    const inReplyTo = email.messageId ?? null;
    const references = uniqEmails([email.references ?? '', email.messageId ?? ''].join(' ').split(/\s+/g))
      .filter(Boolean)
      .join(' ') || null;
    const current = currentAddress ? parseEmailAddress(currentAddress).address.toLowerCase() : null;
    const allRecipients = mode === 'replyAll'
      ? [email.from, ...(email.to ?? []), ...(email.cc ?? [])]
          .map((value) => parseEmailAddress(value).address)
          .filter((value) => !current || value.toLowerCase() !== current)
      : [parseEmailAddress(email.from).address];

    return {
      mode,
      to: uniqEmails(allRecipients),
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
