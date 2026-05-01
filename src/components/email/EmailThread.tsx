'use client';

import { useMemo } from 'react';
import { useEmails } from '@/components/providers/EmailProvider';
import type { Email } from '@/types/email';
import { formatDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview } from '@/lib/utils/email-helpers';
import clsx from 'clsx';

interface EmailThreadProps {
  selectedEmail: Email | null;
  threadEmails: Email[] | null;
  isLoading: boolean;
  error: string | null;
}

export function EmailThread({ selectedEmail, threadEmails, isLoading, error }: EmailThreadProps) {
  const { setSelectedEmail } = useEmails();

  const content = useMemo(() => {
    if (!selectedEmail) return null;
    if (isLoading) return <div className="text-xs text-ink-subtle">Loading thread…</div>;
    if (error) return <div className="text-xs text-red-700">{error}</div>;
    if (!threadEmails || threadEmails.length <= 1) return null;

    return (
      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <div className="px-4 py-2 border-b border-line text-sm font-semibold text-ink">
          Conversation ({threadEmails.length})
        </div>
        <div className="divide-y divide-line">
          {threadEmails.map((email) => {
            const isActive = selectedEmail.id === email.id;
            const preview = getEmailPreview(email.text ?? null, email.html ?? null, 220);
            const who = email.type === 'sent' ? `To: ${email.to?.[0] ? formatEmailAddress(email.to[0]) : '(none)'}` : formatEmailAddress(email.from);

            return (
              <button
                key={email.id}
                type="button"
                onClick={() => setSelectedEmail(email)}
                className={clsx(
                  'w-full text-left px-4 py-3 hover:bg-line/30',
                  isActive && 'bg-accent/10'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={clsx('text-sm truncate', isActive ? 'text-accent font-medium' : 'text-ink')}>{who}</div>
                      {isActive ? (
                        <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                          Open
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-ink-subtle">{preview}</div>
                  </div>
                  <div className="text-xs text-ink-subtle whitespace-nowrap">{formatDate(email.createdAt)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [selectedEmail, threadEmails, isLoading, error, setSelectedEmail]);

  return content;
}
