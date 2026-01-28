import type { Email } from '@/types/email';
import type { EmailThread, ThreadEmail, ThreadBuildOptions } from './types';
import { normalizeSubject, parseEmailAddress } from '@/lib/utils/email-helpers';

function normalizeMessageId(value: string): string {
  return value.trim().replace(/^<|>$/g, '').trim();
}

function parseReferences(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\s+/g)
    .map((v) => v.trim())
    .filter(Boolean)
    .map(normalizeMessageId);
}

function participantKey(email: Email): string {
  const addresses = new Set<string>();
  const add = (raw: string) => addresses.add(parseEmailAddress(raw).address.toLowerCase());

  add(email.from);
  for (const t of email.to ?? []) add(t);
  for (const c of email.cc ?? []) add(c);

  return Array.from(addresses).sort().join('|');
}

function fallbackThreadKey(email: Email): string {
  return `s:${normalizeSubject(email.subject || '').toLowerCase()}|p:${participantKey(email)}`;
}

function directThreadKey(email: Email): string | null {
  if (email.threadId) return `t:${normalizeMessageId(email.threadId)}`;
  if (email.messageId) return `m:${normalizeMessageId(email.messageId)}`;
  const refs = parseReferences(email.references);
  if (refs.length > 0) return `r:${refs[0]}`;
  if (email.inReplyTo) return `i:${normalizeMessageId(email.inReplyTo)}`;
  return null;
}

function chooseThreadKey(email: Email, messageIdToThreadKey: Map<string, string>): string {
  const refs = parseReferences(email.references);
  for (const ref of refs) {
    const existing = messageIdToThreadKey.get(ref);
    if (existing) return existing;
  }

  if (email.inReplyTo) {
    const parent = messageIdToThreadKey.get(normalizeMessageId(email.inReplyTo));
    if (parent) return parent;
  }

  return directThreadKey(email) ?? fallbackThreadKey(email);
}

function dateFromUnknown(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(String(value));
}

export function buildThreads(allEmails: Email[], options?: ThreadBuildOptions): EmailThread[] {
  const includeDeleted = options?.includeDeleted ?? false;
  const includeSpam = options?.includeSpam ?? false;

  const emails = allEmails.filter((e) => {
    if (!includeDeleted && e.isDeleted) return false;
    if (!includeSpam && e.isSpam) return false;
    return true;
  });

  const messageIdToThreadKey = new Map<string, string>();
  const threadKeyToEmails = new Map<string, Email[]>();

  for (const email of emails) {
    const key = chooseThreadKey(email, messageIdToThreadKey);

    if (email.messageId) {
      messageIdToThreadKey.set(normalizeMessageId(email.messageId), key);
    }
    if (email.threadId) {
      messageIdToThreadKey.set(normalizeMessageId(email.threadId), key);
    }

    const arr = threadKeyToEmails.get(key) ?? [];
    arr.push(email);
    threadKeyToEmails.set(key, arr);
  }

  const threads: EmailThread[] = [];

  for (const [threadKey, threadEmails] of threadKeyToEmails.entries()) {
    const sorted = [...threadEmails].sort(
      (a, b) => dateFromUnknown(a.createdAt).getTime() - dateFromUnknown(b.createdAt).getTime()
    );

    const messageIdToEmail = new Map<string, Email>();
    for (const e of sorted) {
      if (e.messageId) messageIdToEmail.set(normalizeMessageId(e.messageId), e);
    }

    const computeDepth = (email: Email): number => {
      const inReplyTo = email.inReplyTo ? normalizeMessageId(email.inReplyTo) : null;
      if (inReplyTo && messageIdToEmail.has(inReplyTo)) return 1;

      const refs = parseReferences(email.references);
      if (refs.length === 0) return 0;

      // If the previous reference exists, treat as one level deep for now.
      const prev = refs[refs.length - 1];
      if (prev && messageIdToEmail.has(prev)) return 1;
      return 0;
    };

    const threadEmailsWithMeta: ThreadEmail[] = sorted.map((e, idx) => ({
      ...e,
      depth: computeDepth(e),
      position: idx,
    }));

    const subject = normalizeSubject(sorted[0]?.subject || '');
    const createdAt = dateFromUnknown(sorted[0]?.createdAt ?? new Date());
    const lastActivityAt = dateFromUnknown(sorted[sorted.length - 1]?.createdAt ?? createdAt);

    const participants = new Set<string>();
    let unreadCount = 0;
    let hasStarred = false;

    for (const e of sorted) {
      participants.add(parseEmailAddress(e.from).address.toLowerCase());
      for (const t of e.to ?? []) participants.add(parseEmailAddress(t).address.toLowerCase());
      for (const c of e.cc ?? []) participants.add(parseEmailAddress(c).address.toLowerCase());
      if (!e.isRead) unreadCount++;
      if (e.isStarred) hasStarred = true;
    }

    const rootEmail = threadEmailsWithMeta[0];
    const latestEmail = threadEmailsWithMeta[threadEmailsWithMeta.length - 1];

    threads.push({
      id: threadKey,
      subject,
      emails: threadEmailsWithMeta,
      rootEmail,
      latestEmail,
      participantCount: participants.size,
      unreadCount,
      hasStarred,
      createdAt,
      lastActivityAt,
    });
  }

  const sortedThreads = threads.sort((a, b) => {
    const aTime = dateFromUnknown(a.lastActivityAt).getTime();
    const bTime = dateFromUnknown(b.lastActivityAt).getTime();
    return (options?.sortOrder ?? 'desc') === 'asc' ? aTime - bTime : bTime - aTime;
  });

  return sortedThreads;
}

