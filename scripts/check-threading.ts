import assert from 'node:assert/strict';
import type { Email } from '../src/types/email';
import { buildThreads } from '../src/lib/threading/algorithm';

function email(overrides: Partial<Email> & Pick<Email, 'id' | 'from' | 'to' | 'subject' | 'createdAt'>): Email {
  return {
    domainId: 'domain-1',
    type: 'received',
    messageId: null,
    cc: null,
    bcc: null,
    replyTo: null,
    html: null,
    text: null,
    headers: null,
    attachments: null,
    inReplyTo: null,
    references: null,
    threadId: null,
    syncedAt: overrides.createdAt,
    isRead: true,
    isStarred: false,
    isSpam: false,
    isDeleted: false,
    isArchived: false,
    folderId: null,
    labels: null,
    ...overrides,
  };
}

const evan = 'Evan <evanbaus@gmail.com>';
const celo = 'Celo <celocamachotri@gmail.com>';

const headerRoot = email({
  id: 'header-root',
  messageId: '<root@example.com>',
  threadId: '<root@example.com>',
  from: evan,
  to: [celo],
  subject: 'Gift + quick thank-you from Training Dojo',
  createdAt: new Date('2026-05-01T10:00:00Z'),
});

const headerReply = email({
  id: 'header-reply',
  messageId: '<reply@example.com>',
  threadId: '<reply@example.com>',
  from: celo,
  to: [evan],
  subject: 'Re: Gift + quick thank-you from Training Dojo',
  inReplyTo: '<root@example.com>',
  references: '<root@example.com>',
  createdAt: new Date('2026-05-01T11:00:00Z'),
});

const headerThreads = buildThreads([headerReply, headerRoot]);
assert.equal(headerThreads.length, 1, 'references/in-reply-to should group replies even when input is newest-first');
assert.deepEqual(headerThreads[0].emails.map((item) => item.id), ['header-root', 'header-reply']);

const fallbackRoot = email({
  id: 'fallback-root',
  messageId: '<fallback-root@example.com>',
  threadId: '<fallback-root@example.com>',
  from: celo,
  to: [evan],
  subject: 'Gift + quick thank-you from Training Dojo',
  createdAt: new Date('2026-05-01T12:00:00Z'),
});

const fallbackReply = email({
  id: 'fallback-reply',
  messageId: '<fallback-reply@example.com>',
  threadId: '<fallback-reply@example.com>',
  from: celo,
  to: [evan],
  subject: 'Re: Gift + quick thank-you from Training Dojo',
  createdAt: new Date('2026-05-01T13:00:00Z'),
});

const unrelated = email({
  id: 'unrelated',
  messageId: '<unrelated@example.com>',
  threadId: '<unrelated@example.com>',
  from: 'Other <other@example.com>',
  to: [evan],
  subject: 'Re: Gift + quick thank-you from Training Dojo',
  createdAt: new Date('2026-05-01T14:00:00Z'),
});

const fallbackThreads = buildThreads([unrelated, fallbackReply, fallbackRoot]);
assert.equal(fallbackThreads.length, 2, 'fallback matching should keep different participants separate');
assert.deepEqual(
  fallbackThreads.find((thread) => thread.emails.some((item) => item.id === 'fallback-root'))?.emails.map((item) => item.id),
  ['fallback-root', 'fallback-reply'],
  'unique per-message threadId values should not split same-participant subject replies'
);
assert.equal(fallbackThreads[0].latestEmail.id, 'unrelated', 'threads should still sort by latest activity');

console.log('Threading checks passed');
