'use client';

import { DomainProvider } from '@/components/providers/DomainProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDomains } from '@/hooks/useDomains';
import { useState } from 'react';
import type { Email } from '@/types/email';

function MainContent() {
  const [activeView, setActiveView] = useState<'inbox' | 'sent' | 'starred' | 'spam' | 'trash'>('inbox');
  const { activeDomain } = useDomains();
  const [emails, setEmails] = useState<Email[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async () => {
    if (!activeDomain) {
      setSyncMessage('Please select a domain first');
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      // Sync received emails
      const receivedResponse = await fetch('/api/emails/received/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: activeDomain.id }),
      });

      const receivedData = await receivedResponse.json();

      // Sync sent emails
      const sentResponse = await fetch('/api/emails/sent/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: activeDomain.id }),
      });

      const sentData = await sentResponse.json();

      setSyncMessage(
        `Synced ${receivedData.synced} received and ${sentData.synced} sent emails`
      );

      // Fetch emails to display
      await loadEmails();
    } catch (error) {
      setSyncMessage('Error syncing emails: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const loadEmails = async () => {
    if (!activeDomain) return;

    const endpoint = activeView === 'sent' ? '/api/emails/sent' : '/api/emails/received';
    const response = await fetch(`${endpoint}?domainId=${activeDomain.id}`);
    const data = await response.json();
    setEmails(data.emails || []);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onCompose={() => alert('Compose functionality coming in Phase 6!')}
      />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h1>
            <Button
              variant="primary"
              onClick={handleSync}
              disabled={isSyncing || !activeDomain}
            >
              {isSyncing ? 'Syncing...' : 'Sync Emails'}
            </Button>
          </div>

          {syncMessage && (
            <Card>
              <p className="text-sm">{syncMessage}</p>
            </Card>
          )}

          <Card>
            <h2 className="text-2xl font-bold mb-4">Phase 3: Email Syncing - Complete!</h2>
            <p className="text-gray-600 mb-4">
              Click "Sync Emails" to fetch emails from Resend and store them in SQLite.
            </p>

            <div className="space-y-2">
              <h3 className="font-bold">Completed Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Sync API routes for received & sent emails</li>
                <li>Email retrieval from cache (SQLite)</li>
                <li>Cursor-based pagination handling</li>
                <li>Duplicate email prevention</li>
                <li>Sync state tracking</li>
              </ul>
            </div>
          </Card>

          {emails.length > 0 && (
            <Card>
              <h3 className="font-bold mb-4">Synced Emails ({emails.length})</h3>
              <div className="space-y-2">
                {emails.slice(0, 10).map((email) => (
                  <div key={email.id} className="p-3 border border-gray-200 bg-gray-50">
                    <p className="font-medium">{email.subject}</p>
                    <p className="text-sm text-gray-600">From: {email.from}</p>
                    <p className="text-xs text-gray-500">{new Date(email.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <DomainProvider>
      <MainContent />
    </DomainProvider>
  );
}
