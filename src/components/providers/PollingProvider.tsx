'use client';

import { createContext, useContext, useMemo } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import { usePolling } from '@/hooks/usePolling';

interface PollingContextType {
  isPolling: boolean;
  lastPolledAt: Date | null;
  error: string | null;
  pollNow: () => Promise<void>;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export function PollingProvider({ children }: { children: React.ReactNode }) {
  const { activeDomain } = useDomains();
  const { refreshEmails, compose } = useEmails();

  const enabled = Boolean(activeDomain) && !compose.isOpen;

  const poll = async () => {
    if (!activeDomain) return;

    const received = await fetch('/api/emails/received/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId: activeDomain.id }),
    });
    if (!received.ok) {
      const text = await received.text();
      throw new Error(text || 'Auto-sync received failed');
    }

    const sent = await fetch('/api/emails/sent/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId: activeDomain.id }),
    });
    if (!sent.ok) {
      const text = await sent.text();
      throw new Error(text || 'Auto-sync sent failed');
    }

    await refreshEmails();
  };

  const { isPolling, lastPolledAt, error, pollNow } = usePolling({ enabled, poll });

  const value = useMemo(
    () => ({ isPolling, lastPolledAt, error, pollNow }),
    [isPolling, lastPolledAt, error, pollNow]
  );

  return <PollingContext.Provider value={value}>{children}</PollingContext.Provider>;
}

export function usePollingContext() {
  const ctx = useContext(PollingContext);
  if (!ctx) throw new Error('usePollingContext must be used within PollingProvider');
  return ctx;
}

