'use client';

import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { Email } from '@/types/email';
import { formatFullDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview } from '@/lib/utils/email-helpers';
import { AttachmentsList } from '@/components/email/AttachmentsList';
import { EmailThread } from '@/components/email/EmailThread';
import { Button } from '@/components/ui/Button';
import { Reply, Forward } from 'lucide-react';
import { useEmails } from '@/components/providers/EmailProvider';
import { EmailActions } from '@/components/email/EmailActions';
import { useEmailActions } from '@/hooks/useEmailActions';

export function EmailDetail({ email }: { email: Email }) {
  const [mode, setMode] = useState<'html' | 'text'>('html');
  const { openComposeReply, openComposeForward } = useEmails();
  const { act } = useEmailActions();

  useEffect(() => {
    if (!email.isRead) {
      act([email.id], 'markRead').catch(() => undefined);
    }
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-gray-500 mb-2">{formatFullDate(email.createdAt)}</div>
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {email.subject?.trim() ? email.subject : '(No subject)'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <EmailActions email={email} />
          <Button variant="ghost" onClick={() => openComposeReply(email)} tooltip="Reply">
            <Reply className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={() => openComposeForward(email)} tooltip="Forward">
            <Forward className="w-4 h-4" />
          </Button>
          <Button
            variant={mode === 'text' ? 'primary' : 'secondary'}
            onClick={() => setMode('text')}
          >
            Text
          </Button>
          <Button
            variant={mode === 'html' ? 'primary' : 'secondary'}
            onClick={() => setMode('html')}
            disabled={!canShowHtml}
          >
            HTML
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <div>
          <span className="text-gray-500">From:</span> {formatEmailAddress(email.from)}
        </div>
        <div>
          <span className="text-gray-500">To:</span>{' '}
          {email.to?.length ? email.to.map(formatEmailAddress).join(', ') : '(none)'}
        </div>
        {email.cc?.length ? (
          <div>
            <span className="text-gray-500">Cc:</span> {email.cc.map(formatEmailAddress).join(', ')}
          </div>
        ) : null}
      </div>

      {email.attachments?.length ? <AttachmentsList attachments={email.attachments} /> : null}

      <div className="border border-gray-200 bg-white">
        <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-gray-900">
          Message
        </div>
        <div className="p-4 text-sm text-gray-900">
          {mode === 'html' && sanitizedHtml ? (
            <div
              className="text-sm text-gray-900 [&_a]:text-accent [&_a]:underline [&_pre]:whitespace-pre-wrap [&_pre]:text-xs [&_code]:text-xs"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{textFallback}</pre>
          )}
        </div>
      </div>

      <EmailThread />
    </div>
  );
}
