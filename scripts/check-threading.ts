import assert from 'node:assert/strict';
import type { Email } from '../src/types/email';
import { buildThreads } from '../src/lib/threading/algorithm';
import { buildDraftFromEmail } from '../src/lib/compose/draft';
import { isReply, normalizeSubject } from '../src/lib/utils/email-helpers';

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

const topic = 'Need more workout imports?';
const replySubjects = [
  'Re:', 'R:', 'RIF:', 'AW:', 'Antwort:', 'Antw:', 'SV:', 'VS:', 'RES:',
  'REF:', 'Réf.:', 'Odp:', 'YNT:', 'Vá:', 'BLS:', 'ATB:', 'ΑΠ:', 'ΣΧΕΤ:',
  'השב:', 'رد:', '回复:', '回覆:', '答复:', '回复：', 'Re[2]:', 'Re(3):',
  '  r : re: AW: ', 'R: Re: R: Re:',
].map((prefix) => `${prefix} ${topic}`);

for (const subject of replySubjects) {
  assert.equal(isReply(subject), true, `should recognize reply prefix: ${subject}`);
  assert.equal(normalizeSubject(subject), topic);
  for (const mode of ['reply', 'replyAll'] as const) {
    const draft = buildDraftFromEmail(mode, { ...fallbackRoot, subject });
    assert.equal(draft.subject, `Re: ${topic}`, `should avoid accumulating reply prefixes: ${subject}`);
    assert.equal(buildDraftFromEmail(mode, { ...fallbackRoot, subject: draft.subject! }).subject, draft.subject);
  }
}

const localizedReplies = [topic, ...replySubjects].map((subject, index) => email({
  ...fallbackRoot,
  id: `localized-${index}`,
  messageId: `<localized-${index}@example.com>`,
  threadId: `<localized-${index}@example.com>`,
  subject,
  createdAt: new Date(Date.UTC(2026, 4, 2, 10, index)),
}));
const localizedThreads = buildThreads([...localizedReplies, { ...unrelated, subject: `AW: ${topic}` }]);
assert.equal(localizedThreads.length, 2, 'localized replies should group without merging different participants');
assert.equal(localizedThreads.find((thread) => thread.emails.some((entry) => entry.id === 'localized-0'))?.emails.length, localizedReplies.length);

for (const subject of ['Order: 123', 'Reactor: update', 'R&D: plans', '[List] Re: update', 'Status: Re: update']) {
  assert.equal(isReply(subject), false);
  assert.equal(normalizeSubject(subject), subject, 'ordinary subject text must be preserved');
  assert.equal(buildDraftFromEmail('reply', { ...fallbackRoot, subject }).subject, `Re: ${subject}`);
}

assert.equal(normalizeSubject(` Fwd: R: Re: FW: ${topic} `), topic);
assert.equal(isReply(`Fwd: ${topic}`), false);
assert.equal(buildDraftFromEmail('reply', { ...fallbackRoot, subject: `R: Fwd: ${topic}` }).subject, `Re: Fwd: ${topic}`);
assert.equal(buildDraftFromEmail('forward', { ...fallbackRoot, subject: `Fwd: ${topic}` }).subject, `Fwd: ${topic}`);
assert.equal(buildDraftFromEmail('reply', { ...fallbackRoot, subject: '' }).subject, 'Re:');

console.log('Threading and reply subject checks passed');
