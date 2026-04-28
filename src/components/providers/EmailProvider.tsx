'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Email } from '@/types/email';
import type { ComposeDraft } from '@/lib/compose/draft';
import { buildDraftFromEmail } from '@/lib/compose/draft';

export type EmailView = 'inbox' | 'sent' | 'starred' | 'spam' | 'trash' | 'archive' | `folder:${string}`;

interface EmailContextType {
  emails: Email[];
  selectedEmails: Set<string>;
  isSelectionMode: boolean;
  isLoading: boolean;
  error: string | null;
  currentView: EmailView;
  selectedEmail: Email | null;
  compose: { isOpen: boolean; draft: ComposeDraft };
  searchQuery: string;
  setCurrentView: (view: EmailView) => void;
  setSelectedEmail: (email: Email | null) => void;
  setSearchQuery: (query: string) => void;
  runSearch: (domainId: string, view: EmailView, query: string) => Promise<void>;
  openComposeNew: () => void;
  openComposeReply: (email: Email) => void;
  openComposeReplyAll: (email: Email) => void;
  openComposeForward: (email: Email) => void;
  closeCompose: () => void;
  loadEmails: (domainId: string, view: EmailView) => Promise<void>;
  toggleEmailSelection: (emailId: string) => void;
  setSelectionMode: (enabled: boolean) => void;
  selectAllEmails: () => void;
  clearSelection: () => void;
  clearMailbox: () => void;
  refreshEmails: () => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
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

  const loadEmails = useCallback(async (domainId: string, view: EmailView) => {
    setIsLoading(true);
    setError(null);
    setCurrentDomainId(domainId);

    try {
      const fetchEmails = async (endpoint: string, params?: Record<string, string>) => {
        const sp = new URLSearchParams({ domainId, ...(params ?? {}) });
        const response = await fetch(`${endpoint}?${sp.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load emails: ${response.statusText}`);
        }
        const data = await response.json();
        return (data.emails || []).map(hydrateEmail) as Email[];
      };

      let fetched: Email[] = [];

      if (view === 'sent') {
        fetched = await fetchEmails('/api/emails/sent');
      } else if (view === 'inbox' || view === 'spam') {
        fetched = await fetchEmails('/api/emails/received');
      } else if (view === 'starred' || view === 'trash') {
        const [received, sent] = await Promise.all([
          fetchEmails('/api/emails/received', view === 'trash' ? { includeDeleted: 'true' } : undefined),
          fetchEmails('/api/emails/sent', view === 'trash' ? { includeDeleted: 'true' } : undefined),
        ]);
        fetched = [...received, ...sent];
      } else if (view === 'archive' || view.startsWith('folder:')) {
        const [received, sent] = await Promise.all([
          fetchEmails('/api/emails/received'),
          fetchEmails('/api/emails/sent'),
        ]);
        fetched = [...received, ...sent];
      }

      let filtered = fetched;
      const folderId = view.startsWith('folder:') ? view.slice('folder:'.length) : null;

      if (view === 'starred') {
        filtered = filtered.filter((e) => e.isStarred && !e.isDeleted);
      } else if (view === 'spam') {
        filtered = filtered.filter((e) => e.isSpam && !e.isDeleted);
      } else if (view === 'trash') {
        filtered = filtered.filter((e) => e.isDeleted);
      } else if (view === 'archive') {
        filtered = filtered.filter((e) => e.isArchived && !e.isDeleted && !e.isSpam);
      } else if (folderId) {
        filtered = filtered.filter((e) => e.folderId === folderId && !e.isDeleted && !e.isSpam && !e.isArchived);
      } else if (view === 'inbox') {
        filtered = filtered.filter((e) => e.type === 'received' && !e.isDeleted && !e.isSpam && !e.isArchived && !e.folderId);
      } else if (view === 'sent') {
        filtered = filtered.filter((e) => e.type === 'sent' && !e.isDeleted);
      }

      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setEmails(filtered);
      setSelectedEmail((prev) => {
        if (!prev) return prev;
        return filtered.find((e) => e.id === prev.id) ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
      setEmails([]);
      setSelectedEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateEmail]);

  const runSearch = useCallback(
    async (domainId: string, view: EmailView, query: string) => {
      const q = query.trim();
      if (!q) {
        await loadEmails(domainId, view);
        return;
      }

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
            filters: {
              type: view === 'sent' ? 'sent' : view === 'inbox' || view === 'spam' ? 'received' : undefined,
            },
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.details || data?.error || 'Failed to search');
        }

        const data = await res.json();
        let filtered = (data.emails || []).map(hydrateEmail) as Email[];

        if (view === 'starred') filtered = filtered.filter((e) => e.isStarred && !e.isDeleted);
        if (view === 'spam') filtered = filtered.filter((e) => e.isSpam && !e.isDeleted);
        if (view === 'trash') filtered = filtered.filter((e) => e.isDeleted);
        if (view === 'archive') filtered = filtered.filter((e) => e.isArchived && !e.isDeleted && !e.isSpam);
        if (view.startsWith('folder:')) {
          const folderId = view.slice('folder:'.length);
          filtered = filtered.filter((e) => e.folderId === folderId && !e.isDeleted && !e.isSpam && !e.isArchived);
        }
        if (view === 'inbox') filtered = filtered.filter((e) => e.type === 'received' && !e.isDeleted && !e.isSpam && !e.isArchived && !e.folderId);
        if (view === 'sent') filtered = filtered.filter((e) => e.type === 'sent' && !e.isDeleted);

        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setEmails(filtered);
        setSelectedEmail((prev) => (prev ? filtered.find((e) => e.id === prev.id) ?? null : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search');
        setEmails([]);
        setSelectedEmail(null);
      } finally {
        setIsLoading(false);
      }
    },
    [hydrateEmail, loadEmails]
  );

  const refreshEmails = useCallback(async () => {
    if (currentDomainId) {
      if (searchQuery.trim()) {
        await runSearch(currentDomainId, currentView, searchQuery);
      } else {
        await loadEmails(currentDomainId, currentView);
      }
    }
  }, [currentDomainId, currentView, loadEmails, runSearch, searchQuery]);

  const toggleEmailSelection = useCallback((emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  }, []);

  const selectAllEmails = useCallback(() => {
    setSelectedEmails(new Set(emails.map(e => e.id)));
  }, [emails]);

  const clearSelection = useCallback(() => {
    setSelectedEmails(new Set());
  }, []);

  const setSelectionMode = useCallback((enabled: boolean) => {
    setIsSelectionMode(enabled);
    if (!enabled) setSelectedEmails(new Set());
  }, []);

  const clearMailbox = useCallback(() => {
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

  const openComposeReply = useCallback((email: Email) => {
    setCompose({ isOpen: true, draft: buildDraftFromEmail('reply', email) });
  }, []);

  const openComposeReplyAll = useCallback((email: Email) => {
    setCompose({ isOpen: true, draft: buildDraftFromEmail('replyAll', email, email.to?.[0]) });
  }, []);

  const openComposeForward = useCallback((email: Email) => {
    setCompose({ isOpen: true, draft: buildDraftFromEmail('forward', email) });
  }, []);

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
