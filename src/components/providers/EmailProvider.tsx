'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Email, EmailSummary } from '@/types/email';
import type { ComposeDraft } from '@/lib/compose/draft';
import { buildDraftFromEmail } from '@/lib/compose/draft';

export type EmailView = 'inbox' | 'sent' | 'starred' | 'spam' | 'trash' | 'archive' | `folder:${string}`;

interface EmailContextType {
  emails: EmailSummary[];
  selectedEmails: Set<string>;
  isSelectionMode: boolean;
  isLoading: boolean;
  error: string | null;
  currentView: EmailView;
  selectedEmail: Email | null;
  compose: { isOpen: boolean; draft: ComposeDraft };
  searchQuery: string;
  setCurrentView: (view: EmailView) => void;
  setSelectedEmail: React.Dispatch<React.SetStateAction<Email | null>>;
  setSearchQuery: (query: string) => void;
  runSearch: (domainId: string, view: EmailView, query: string) => Promise<void>;
  selectEmail: (email: EmailSummary) => Promise<void>;
  fetchFullEmail: (email: Email | EmailSummary) => Promise<Email>;
  openComposeNew: () => void;
  openComposeReply: (email: Email | EmailSummary) => Promise<void>;
  openComposeReplyAll: (email: Email | EmailSummary) => Promise<void>;
  openComposeForward: (email: Email | EmailSummary) => Promise<void>;
  closeCompose: () => void;
  loadEmails: (domainId: string, view: EmailView) => Promise<void>;
  toggleEmailSelection: (emailId: string | string[]) => void;
  setSelectionMode: (enabled: boolean) => void;
  selectAllEmails: (emailIds?: string[]) => void;
  clearSelection: () => void;
  clearMailbox: () => void;
  refreshEmails: (domainId?: string) => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<EmailView>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [currentDomainId, setCurrentDomainId] = useState<string | null>(null);
  const [compose, setCompose] = useState<{ isOpen: boolean; draft: ComposeDraft }>({
    isOpen: false,
    draft: { mode: 'new' },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const requestSeq = useRef(0);

  const hydrateEmail = useCallback((raw: unknown): Email => {
    const base = raw as unknown as Omit<Email, 'createdAt' | 'syncedAt'> & {
      createdAt: unknown;
      syncedAt: unknown;
    };

    const toDate = (value: unknown) => {
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') return new Date(value);
      return new Date(String(value));
    };

    return {
      ...base,
      createdAt: toDate(base.createdAt),
      syncedAt: toDate(base.syncedAt),
    };
  }, []);

  const hydrateEmailSummary = useCallback((raw: unknown): EmailSummary => {
    const base = raw as unknown as Omit<EmailSummary, 'createdAt' | 'syncedAt'> & {
      createdAt: unknown;
      syncedAt: unknown;
    };

    const toDate = (value: unknown) => {
      if (value instanceof Date) return value;
      if (typeof value === 'string' || typeof value === 'number') return new Date(value);
      return new Date(String(value));
    };

    return {
      ...base,
      createdAt: toDate(base.createdAt),
      syncedAt: toDate(base.syncedAt),
    };
  }, []);

  const fetchFullEmail = useCallback(async (email: Email | EmailSummary): Promise<Email> => {
    if ('html' in email || 'text' in email || 'headers' in email || 'attachments' in email) {
      return email as Email;
    }

    const endpoint = email.type === 'sent' ? `/api/emails/sent/${email.id}` : `/api/emails/received/${email.id}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error('Failed to load email');
    }

    const data = await response.json();
    return hydrateEmail(data.email);
  }, [hydrateEmail]);

  const selectEmail = useCallback(async (email: EmailSummary) => {
    const fullEmail = await fetchFullEmail(email);
    setSelectedEmail(fullEmail);
  }, [fetchFullEmail]);

  const loadEmails = useCallback(async (domainId: string, view: EmailView) => {
    const requestId = ++requestSeq.current;
    const isCurrentRequest = () => requestSeq.current === requestId;

    setIsLoading(true);
    setError(null);
    setCurrentDomainId(domainId);

    try {
      const fetchEmails = async () => {
        const sp = new URLSearchParams({ domainId, view });
        const response = await fetch(`/api/emails?${sp.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load emails: ${response.statusText}`);
        }
        const data = await response.json();
        return (data.emails || []).map(hydrateEmailSummary) as EmailSummary[];
      };

      const filtered = await fetchEmails();

      if (!isCurrentRequest()) return;

      setEmails(filtered);
      setSelectedEmail((prev) => {
        if (!prev) return prev;
        const updatedSummary = filtered.find((e) => e.id === prev.id && e.domainId === domainId);
        return updatedSummary ? { ...prev, ...updatedSummary } : null;
      });
    } catch (err) {
      if (!isCurrentRequest()) return;
      setError(err instanceof Error ? err.message : 'Failed to load emails');
      setEmails([]);
      setSelectedEmail(null);
    } finally {
      if (isCurrentRequest()) setIsLoading(false);
    }
  }, [hydrateEmailSummary]);

  const runSearch = useCallback(
    async (domainId: string, view: EmailView, query: string) => {
      const q = query.trim();
      if (!q) {
        await loadEmails(domainId, view);
        return;
      }

      const requestId = ++requestSeq.current;
      const isCurrentRequest = () => requestSeq.current === requestId;

      setIsLoading(true);
      setError(null);
      setCurrentDomainId(domainId);

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domainId,
            query: q,
            view,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.details || data?.error || 'Failed to search');
        }

        const data = await res.json();
        const filtered = (data.emails || []).map(hydrateEmailSummary) as EmailSummary[];
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (!isCurrentRequest()) return;
        setEmails(filtered);
        setSelectedEmail((prev) => {
          if (!prev) return prev;
          const updatedSummary = filtered.find((e) => e.id === prev.id && e.domainId === domainId);
          return updatedSummary ? { ...prev, ...updatedSummary } : null;
        });
      } catch (err) {
        if (!isCurrentRequest()) return;
        setError(err instanceof Error ? err.message : 'Failed to search');
        setEmails([]);
        setSelectedEmail(null);
      } finally {
        if (isCurrentRequest()) setIsLoading(false);
      }
    },
    [hydrateEmailSummary, loadEmails]
  );

  const refreshEmails = useCallback(async (domainId?: string) => {
    const targetDomainId = domainId ?? currentDomainId;

    if (targetDomainId) {
      if (searchQuery.trim()) {
        await runSearch(targetDomainId, currentView, searchQuery);
      } else {
        await loadEmails(targetDomainId, currentView);
      }
    }
  }, [currentDomainId, currentView, loadEmails, runSearch, searchQuery]);

  const toggleEmailSelection = useCallback((emailId: string | string[]) => {
    const emailIds = Array.isArray(emailId) ? emailId : [emailId];
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      const allSelected = emailIds.length > 0 && emailIds.every((id) => newSet.has(id));

      if (allSelected) {
        emailIds.forEach((id) => newSet.delete(id));
      } else {
        emailIds.forEach((id) => newSet.add(id));
      }

      return newSet;
    });
  }, []);

  const selectAllEmails = useCallback((emailIds?: string[]) => {
    setSelectedEmails(new Set(emailIds ?? emails.map(e => e.id)));
  }, [emails]);

  const clearSelection = useCallback(() => {
    setSelectedEmails(new Set());
  }, []);

  const setSelectionMode = useCallback((enabled: boolean) => {
    setIsSelectionMode(enabled);
    if (!enabled) setSelectedEmails(new Set());
  }, []);

  const clearMailbox = useCallback(() => {
    requestSeq.current += 1;
    setEmails([]);
    setSelectedEmails(new Set());
    setIsSelectionMode(false);
    setSelectedEmail(null);
    setCurrentDomainId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Clear selection when view changes
    clearSelection();
    setIsSelectionMode(false);
    setSelectedEmail(null);
    setSearchQuery('');
  }, [currentView, clearSelection, setSelectedEmail]);

  const openComposeNew = useCallback(() => {
    setCompose({ isOpen: true, draft: { mode: 'new' } });
  }, []);

  const openComposeReply = useCallback(async (email: Email | EmailSummary) => {
    setCompose({ isOpen: true, draft: buildDraftFromEmail('reply', await fetchFullEmail(email)) });
  }, [fetchFullEmail]);

  const openComposeReplyAll = useCallback(async (email: Email | EmailSummary) => {
    const fullEmail = await fetchFullEmail(email);
    setCompose({ isOpen: true, draft: buildDraftFromEmail('replyAll', fullEmail, fullEmail.to?.[0]) });
  }, [fetchFullEmail]);

  const openComposeForward = useCallback(async (email: Email | EmailSummary) => {
    setCompose({ isOpen: true, draft: buildDraftFromEmail('forward', await fetchFullEmail(email)) });
  }, [fetchFullEmail]);

  const closeCompose = useCallback(() => {
    setCompose((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const value: EmailContextType = {
    emails,
    selectedEmails,
    isSelectionMode,
    isLoading,
    error,
    currentView,
    selectedEmail,
    compose,
    searchQuery,
    setCurrentView,
    setSelectedEmail,
    setSearchQuery,
    runSearch,
    selectEmail,
    fetchFullEmail,
    openComposeNew,
    openComposeReply,
    openComposeReplyAll,
    openComposeForward,
    closeCompose,
    loadEmails,
    toggleEmailSelection,
    setSelectionMode,
    selectAllEmails,
    clearSelection,
    clearMailbox,
    refreshEmails,
  };

  return <EmailContext.Provider value={value}>{children}</EmailContext.Provider>;
}

export function useEmails() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmails must be used within an EmailProvider');
  }
  return context;
}
