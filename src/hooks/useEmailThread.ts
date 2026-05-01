'use client';

import { useEffect, useState } from 'react';
import type { Email } from '@/types/email';

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
  const [threadEmails, setThreadEmails] = useState<Email[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email?.id) {
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
        const response = await fetch(`/api/emails/thread/${email.id}`);
        if (!response.ok) throw new Error('Failed to load thread');

        const payload = await response.json();
        const thread = (payload.emails ?? []).map(hydrateDates) as Email[];
        if (!cancelled) setThreadEmails(thread.length > 0 ? thread : [email]);
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
  }, [email]);

  return {
    threadEmails,
    isLoading,
    error,
  };
}
