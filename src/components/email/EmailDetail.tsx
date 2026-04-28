'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { Email } from '@/types/email';
import { formatFullDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview, parseEmailAddress } from '@/lib/utils/email-helpers';
import { AttachmentsList } from '@/components/email/AttachmentsList';
import { EmailThread } from '@/components/email/EmailThread';
import { EmailActions } from '@/components/email/EmailActions';
import { useEmails } from '@/components/providers/EmailProvider';
import { useEmailActions } from '@/hooks/useEmailActions';
import { ChevronLeft, Reply as ReplyIcon, Forward as ForwardIcon } from 'lucide-react';
import clsx from 'clsx';

export function EmailDetail({ email }: { email: Email }) {
  const [mode, setMode] = useState<'html' | 'text'>('html');
  const { openComposeReply, openComposeForward, setSelectedEmail } = useEmails();
  const { act } = useEmailActions();

  // Guard so we only fire markRead once per email.id, regardless of `act`
  // identity churn (it depends on selectedEmail upstream).
  const markedReadRef = useRef<string | null>(null);
  useEffect(() => {
    if (email.isRead) return;
    if (markedReadRef.current === email.id) return;
    markedReadRef.current = email.id;
    act([email.id], 'markRead').catch(() => {
      // Allow a retry on the next render if the request failed.
      markedReadRef.current = null;
    });
  }, [email.id, email.isRead, act]);

  const sanitizedHtml = useMemo(() => {
    const html = email.html ?? null;
    if (!html) return null;
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [email.html]);

  const textFallback = useMemo(() => {
    return getEmailPreview(email.text ?? null, email.html ?? null, 50000);
  }, [email.text, email.html]);

  const canShowHtml = Boolean(sanitizedHtml);
  const fromParsed = parseEmailAddress(email.from);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sticky header (mobile back button + actions) */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-3 py-2 flex items-center gap-2 pt-safe">
        <button
          type="button"
          onClick={() => setSelectedEmail(null)}
          aria-label="Back"
          className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-full text-ink hover:bg-line/40"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base lg:text-lg font-semibold text-ink truncate">
            {email.subject?.trim() ? email.subject : '(No subject)'}
          </h2>
        </div>
        <div className="flex items-center">
          <EmailActions email={email} />
        </div>
      </div>

      {/* Scrolling content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 lg:px-6 py-4 space-y-4">
          {/* From / meta */}
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 h-10 w-10 rounded-full inline-flex items-center justify-center text-sm font-semibold bg-line/60 text-ink"
              aria-hidden
            >
              {(fromParsed.name || fromParsed.address || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink truncate">
                {formatEmailAddress(email.from)}
              </div>
              <div className="text-xs text-ink-subtle truncate">
                {fromParsed.name ? fromParsed.address : ''}
              </div>
              <div className="text-xs text-ink-subtle mt-1">
                to {email.to?.length ? email.to.map(formatEmailAddress).join(', ') : '(none)'}
                {email.cc?.length ? ` · cc ${email.cc.map(formatEmailAddress).join(', ')}` : ''}
              </div>
              <div className="text-xs text-ink-subtle">{formatFullDate(email.createdAt)}</div>
            </div>
          </div>

          {email.attachments?.length ? <AttachmentsList attachments={email.attachments} /> : null}

          {/* HTML/Text toggle (only show if both present) */}
          {canShowHtml && (
            <div className="inline-flex gap-1 p-1 rounded-xl bg-line/40">
              <button
                type="button"
                onClick={() => setMode('html')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium',
                  mode === 'html' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                )}
              >
                Rich
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium',
                  mode === 'text' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                )}
              >
                Text
              </button>
            </div>
          )}

          {/* Body */}
          <div className="rounded-2xl border border-line bg-surface overflow-hidden">
            {mode === 'html' && sanitizedHtml ? (
              <div className="email-html p-4 lg:p-5" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans p-4 lg:p-5 text-[15px] leading-6 text-ink">
                {textFallback}
              </pre>
            )}
          </div>

          <EmailThread />
        </div>
      </div>

      {/* Sticky reply bar */}
      <div className="sticky bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur pb-safe">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => openComposeReply(email)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover"
          >
            <ReplyIcon className="w-4 h-4" />
            Reply
          </button>
          <button
            type="button"
            onClick={() => openComposeForward(email)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-medium text-ink hover:bg-line/40"
          >
            <ForwardIcon className="w-4 h-4" />
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
