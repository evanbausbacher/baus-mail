'use client';

import { useCallback, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { EmailList } from '@/components/email/EmailList';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import { formatFullDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview } from '@/lib/utils/email-helpers';

export function MainLayout() {
  const { activeDomain } = useDomains();
  const { currentView, setCurrentView, loadEmails, refreshEmails, selectedEmail } = useEmails();

  const handleCompose = useCallback(() => {
    alert('Compose functionality is planned for Phase 6.');
  }, []);

  const handleSync = useCallback(async () => {
    if (!activeDomain) {
      throw new Error('Please select a domain first');
    }

    const [receivedResponse, sentResponse] = await Promise.all([
      fetch('/api/emails/received/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: activeDomain.id }),
      }),
      fetch('/api/emails/sent/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: activeDomain.id }),
      }),
    ]);

    if (!receivedResponse.ok) {
      const text = await receivedResponse.text();
      throw new Error(text || 'Failed to sync received emails');
    }
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
      <Sidebar activeView={currentView} onViewChange={setCurrentView} onCompose={handleCompose} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onSync={handleSync} onCompose={handleCompose} />

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
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">{formatFullDate(selectedEmail.createdAt)}</div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedEmail.subject?.trim() ? selectedEmail.subject : '(No subject)'}
                  </h2>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-gray-500">From:</span> {formatEmailAddress(selectedEmail.from)}
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>{' '}
                    {selectedEmail.to?.length ? selectedEmail.to.map(formatEmailAddress).join(', ') : '(none)'}
                  </div>
                </div>

                <div className="border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                  {getEmailPreview(selectedEmail.text ?? null, selectedEmail.html ?? null, 1500)}
                </div>

                <div className="text-xs text-gray-500">
                  Full email rendering and threading are planned for Phase 5.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

