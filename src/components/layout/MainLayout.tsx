'use client';

import { useCallback, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { EmailList } from '@/components/email/EmailList';
import { EmailDetail } from '@/components/email/EmailDetail';
import { ComposeModal } from '@/components/compose/ComposeModal';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';

export function MainLayout() {
  const { activeDomain } = useDomains();
  const { currentView, setCurrentView, loadEmails, refreshEmails, selectedEmail, compose, openComposeNew, closeCompose } =
    useEmails();

  const handleSync = useCallback(async () => {
    if (!activeDomain) {
      throw new Error('Please select a domain first');
    }

    const receivedResponse = await fetch('/api/emails/received/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId: activeDomain.id }),
    });

    if (!receivedResponse.ok) {
      const text = await receivedResponse.text();
      throw new Error(text || 'Failed to sync received emails');
    }

    const sentResponse = await fetch('/api/emails/sent/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId: activeDomain.id }),
    });

    if (!sentResponse.ok) {
      const text = await sentResponse.text();
      throw new Error(text || 'Failed to sync sent emails');
    }

    await refreshEmails();
  }, [activeDomain, refreshEmails]);

  useEffect(() => {
    if (!activeDomain) return;
    loadEmails(activeDomain.id, currentView);
  }, [activeDomain, currentView, loadEmails]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={currentView} onViewChange={setCurrentView} onCompose={openComposeNew} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onSync={handleSync} onCompose={openComposeNew} />

        <div className="flex flex-1 min-h-0">
          <div className="w-[420px] border-r border-gray-200 bg-white overflow-auto">
            <EmailList />
          </div>

          <div className="flex-1 min-w-0 bg-white overflow-auto">
            {!selectedEmail ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Select an email to view details
              </div>
            ) : (
              <EmailDetail email={selectedEmail} />
            )}
          </div>
        </div>
      </div>

      <ComposeModal isOpen={compose.isOpen} onClose={closeCompose} initial={compose.draft} />
    </div>
  );
}
