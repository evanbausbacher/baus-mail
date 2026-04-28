'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileTopBar } from '@/components/layout/MobileTopBar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { ComposeFab } from '@/components/layout/ComposeFab';
import { EmailList } from '@/components/email/EmailList';
import { EmailDetail } from '@/components/email/EmailDetail';
import { ComposeSheet } from '@/components/compose/ComposeSheet';
import { SettingsSheet } from '@/components/settings/SettingsSheet';
import { AddDomainSheet } from '@/components/settings/AddDomainSheet';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';

export function AppShell() {
  const { activeDomain } = useDomains();
  const {
    currentView,
    setCurrentView,
    loadEmails,
    refreshEmails,
    selectedEmail,
    compose,
    openComposeNew,
    closeCompose,
  } = useEmails();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addDomainOpen, setAddDomainOpen] = useState(false);

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

  const detailOpen = Boolean(selectedEmail);

  return (
    <div className="min-h-dvh bg-background text-ink">
      {/* ============ Mobile (< lg) ============ */}
      <div className="lg:hidden h-dvh flex flex-col">
        {!detailOpen && <MobileTopBar onOpenDrawer={() => setDrawerOpen(true)} onSync={handleSync} />}

        <main className="flex-1 min-h-0 overflow-y-auto">
          {!activeDomain ? (
            <EmptyState
              title="Welcome to BausMail"
              body="Add your first Resend mailbox to start sending and receiving."
              actionLabel="Add mailbox"
              onAction={() => setAddDomainOpen(true)}
            />
          ) : detailOpen && selectedEmail ? (
            <EmailDetail email={selectedEmail} />
          ) : (
            <EmailList />
          )}
        </main>

        <ComposeFab onCompose={openComposeNew} visible={!detailOpen && Boolean(activeDomain)} />

        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          onAddDomain={() => setAddDomainOpen(true)}
        />
      </div>

      {/* ============ Desktop (≥ lg) ============ */}
      <div className="hidden lg:flex h-screen">
        <Sidebar
          activeView={currentView}
          onViewChange={setCurrentView}
          onCompose={openComposeNew}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onSync={handleSync} onCompose={openComposeNew} />

          <div className="flex flex-1 min-h-0">
            <div className="w-[420px] border-r border-line bg-surface overflow-auto">
              <EmailList />
            </div>

            <div className="flex-1 min-w-0 bg-surface overflow-auto">
              {!selectedEmail ? (
                <div className="h-full flex items-center justify-center text-sm text-ink-subtle">
                  Select an email to view details
                </div>
              ) : (
                <EmailDetail email={selectedEmail} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ Sheets/Modals (shared) ============ */}
      <ComposeSheet isOpen={compose.isOpen} onClose={closeCompose} initial={compose.draft} />
      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onAddDomain={() => {
          setSettingsOpen(false);
          setAddDomainOpen(true);
        }}
      />
      <AddDomainSheet isOpen={addDomainOpen} onClose={() => setAddDomainOpen(false)} />
    </div>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="text-lg font-semibold text-ink">{title}</div>
      <div className="text-sm text-ink-muted mt-2 max-w-xs">{body}</div>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover"
      >
        {actionLabel}
      </button>
    </div>
  );
}
