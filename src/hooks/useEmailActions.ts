'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import type { Email } from '@/types/email';
import type { EmailActionInput } from '@/lib/utils/validation';

type Action = EmailActionInput['action'];

async function postAction(emailIds: string[], action: Action, folderId?: string) {
  const res = await fetch('/api/emails/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailIds, action, folderId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.details || data?.error || 'Failed to perform action');
  }
}

async function fetchEmailById(email: Email): Promise<Email> {
  const endpoint = email.type === 'sent' ? `/api/emails/sent/${email.id}` : `/api/emails/received/${email.id}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Failed to refresh email');
  const data = await res.json();
  const raw = data.email as unknown as Omit<Email, 'createdAt' | 'syncedAt'> & {
    createdAt: unknown;
    syncedAt: unknown;
  };

  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date(String(value));
  };

  return {
    ...raw,
    createdAt: toDate(raw.createdAt),
    syncedAt: toDate(raw.syncedAt),
  };
}

export function useEmailActions() {
  const { refreshEmails, selectedEmail, setSelectedEmail, clearSelection } = useEmails();
  const { activeDomain } = useDomains();
  const activeDomainId = activeDomain?.id ?? null;
  const activeDomainIdRef = useRef<string | null>(activeDomainId);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    activeDomainIdRef.current = activeDomainId;
  }, [activeDomainId]);

  const act = useCallback(
    async (emailIds: string[], action: Action, opts?: { clearSelection?: boolean; folderId?: string }) => {
      setIsActing(true);
      setError(null);
      try {
        const selectedAtStart = selectedEmail;
        const actionDomainId = activeDomainId;
        await postAction(emailIds, action, opts?.folderId);
        if (actionDomainId && activeDomainIdRef.current === actionDomainId) {
          await refreshEmails(actionDomainId);
        }

        if (selectedAtStart && emailIds.includes(selectedAtStart.id)) {
          try {
            const refreshed = await fetchEmailById(selectedAtStart);
            setSelectedEmail((current) => (current?.id === selectedAtStart.id ? refreshed : current));
          } catch {
            // If it no longer belongs in the current filtered view, clear it.
            setSelectedEmail((current) => (current?.id === selectedAtStart.id ? null : current));
          }
        }

        if (opts?.clearSelection) clearSelection();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to perform action');
        throw e;
      } finally {
        setIsActing(false);
      }
    },
    [activeDomainId, refreshEmails, selectedEmail, setSelectedEmail, clearSelection]
  );

  const toggleStar = useCallback(
    async (email: Email) => {
      await act([email.id], email.isStarred ? 'unstar' : 'star');
    },
    [act]
  );

  const toggleRead = useCallback(
    async (email: Email) => {
      await act([email.id], email.isRead ? 'markUnread' : 'markRead');
    },
    [act]
  );

  const toggleSpam = useCallback(
    async (email: Email) => {
      await act([email.id], email.isSpam ? 'notSpam' : 'spam');
    },
    [act]
  );

  const trash = useCallback(
    async (email: Email) => {
      await act([email.id], 'delete');
    },
    [act]
  );

  const archive = useCallback(
    async (email: Email) => {
      await act([email.id], email.isArchived ? 'unarchive' : 'archive');
    },
    [act]
  );

  const moveToFolder = useCallback(
    async (emailIds: string[], folderId: string, opts?: { clearSelection?: boolean }) => {
      await act(emailIds, 'moveToFolder', { ...opts, folderId });
    },
    [act]
  );

  return {
    isActing,
    error,
    act,
    toggleStar,
    toggleRead,
    toggleSpam,
    trash,
    archive,
    moveToFolder,
  };
}
