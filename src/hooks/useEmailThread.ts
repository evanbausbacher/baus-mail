'use client';

import { useEffect, useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import type { Email } from '@/types/email';
import { buildThreads } from '@/lib/threading/algorithm';

function hydrateDates(raw: unknown): Email {
  const base = raw as Omit<Email, 'createdAt' | 'syncedAt'> & {
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

export function useEmailThread(email: Email | null) {
  const { activeDomain } = useDomains();
  const [threadEmails, setThreadEmails] = useState<Email[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDomain || !email?.id) {
      setThreadEmails(null);
      setError(null);
      setIsLoading(false);
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
        const thread = threads.find((candidate) => candidate.emails.some((entry) => entry.id === email.id));

        if (!thread) {
          const singleEmail = all.find((entry) => entry.id === email.id) ?? email;
          if (!cancelled) setThreadEmails([singleEmail]);
          return;
        }

        if (!cancelled) setThreadEmails(thread.emails);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load thread');
          setThreadEmails([email]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeDomain, email]);

  return {
    threadEmails,
    isLoading,
    error,
  };
}
