'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Email } from '@/types/email';

export type EmailView = 'inbox' | 'sent' | 'starred' | 'spam' | 'trash';

interface EmailContextType {
  emails: Email[];
  selectedEmails: Set<string>;
  isLoading: boolean;
  error: string | null;
  currentView: EmailView;
  selectedEmail: Email | null;
  setCurrentView: (view: EmailView) => void;
  setSelectedEmail: (email: Email | null) => void;
  loadEmails: (domainId: string, view: EmailView) => Promise<void>;
  toggleEmailSelection: (emailId: string) => void;
  selectAllEmails: () => void;
  clearSelection: () => void;
  refreshEmails: () => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<EmailView>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [currentDomainId, setCurrentDomainId] = useState<string | null>(null);

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
      }

      let filtered = fetched;

      if (view === 'starred') {
        filtered = filtered.filter((e) => e.isStarred && !e.isDeleted);
      } else if (view === 'spam') {
        filtered = filtered.filter((e) => e.isSpam && !e.isDeleted);
      } else if (view === 'trash') {
        filtered = filtered.filter((e) => e.isDeleted);
      } else if (view === 'inbox') {
        filtered = filtered.filter((e) => e.type === 'received' && !e.isDeleted && !e.isSpam);
      } else if (view === 'sent') {
        filtered = filtered.filter((e) => e.type === 'sent' && !e.isDeleted);
      }

      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setEmails(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateEmail]);

  const refreshEmails = useCallback(async () => {
    if (currentDomainId) {
      await loadEmails(currentDomainId, currentView);
    }
  }, [currentDomainId, currentView, loadEmails]);

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

  useEffect(() => {
    // Clear selection when view changes
    clearSelection();
    setSelectedEmail(null);
  }, [currentView, clearSelection, setSelectedEmail]);

  const value: EmailContextType = {
    emails,
    selectedEmails,
    isLoading,
    error,
    currentView,
    selectedEmail,
    setCurrentView,
    setSelectedEmail,
    loadEmails,
    toggleEmailSelection,
    selectAllEmails,
    clearSelection,
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
