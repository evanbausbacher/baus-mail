'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import type { Email } from '@/types/email';
import { buildThreads } from '@/lib/threading/algorithm';
import { formatDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview } from '@/lib/utils/email-helpers';
import clsx from 'clsx';

function hydrateDates(raw: unknown): Email {
  const base = raw as unknown as Omit<Email, 'createdAt' | 'syncedAt'> & {
    createdAt: unknown;
    syncedAt: unknown;
  };

  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date(String(value));
  };

  return { ...base, createdAt: toDate(base.createdAt), syncedAt: toDate(base.syncedAt) };
}

export function EmailThread() {
  const { activeDomain } = useDomains();
  const { selectedEmail, setSelectedEmail } = useEmails();
  const [threadEmails, setThreadEmails] = useState<Email[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedId = selectedEmail?.id ?? null;

  useEffect(() => {
    if (!activeDomain || !selectedId) {
      setThreadEmails(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const baseParams = new URLSearchParams({ domainId: activeDomain.id, includeDeleted: 'true' }).toString();
        const [receivedRes, sentRes] = await Promise.all([
          fetch(`/api/emails/received?${baseParams}`),
          fetch(`/api/emails/sent?${baseParams}`),
        ]);

        if (!receivedRes.ok) throw new Error('Failed to load received emails');
        if (!sentRes.ok) throw new Error('Failed to load sent emails');

        const receivedJson = await receivedRes.json();
        const sentJson = await sentRes.json();

        const all = [...(receivedJson.emails ?? []), ...(sentJson.emails ?? [])].map(hydrateDates) as Email[];
        const threads = buildThreads(all, { includeDeleted: true, includeSpam: true, sortOrder: 'asc' });
        const thread = threads.find((t) => t.emails.some((e) => e.id === selectedId));

        if (!thread) {
          if (!cancelled) setThreadEmails([all.find((e) => e.id === selectedId)!].filter(Boolean));
          return;
        }

        if (!cancelled) setThreadEmails(thread.emails);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load thread');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeDomain, selectedId]);

  const content = useMemo(() => {
    if (!selectedEmail) return null;
    if (isLoading) return <div className="text-xs text-gray-500">Loading thread…</div>;
    if (error) return <div className="text-xs text-red-700">{error}</div>;
    if (!threadEmails || threadEmails.length <= 1) return <div className="text-xs text-gray-500">No thread messages found.</div>;

    return (
      <div className="border border-gray-200 bg-white">
        <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-gray-900">
          Thread ({threadEmails.length})
        </div>
        <div className="divide-y divide-gray-200">
          {threadEmails.map((email) => {
            const isActive = selectedEmail.id === email.id;
            const preview = getEmailPreview(email.text ?? null, email.html ?? null, 120);
            const who = email.type === 'sent' ? `To: ${email.to?.[0] ? formatEmailAddress(email.to[0]) : '(none)'}` : formatEmailAddress(email.from);

            return (
              <button
                key={email.id}
                type="button"
                onClick={() => setSelectedEmail(email)}
                className={clsx(
                  'w-full text-left px-4 py-3 hover:bg-gray-50',
                  isActive && 'bg-gray-100'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-900 truncate">{who}</div>
                    <div className="text-xs text-gray-500 truncate mt-1">{preview}</div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(email.createdAt)}</div>
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
