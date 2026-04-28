'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileTopBar } from '@/components/layout/MobileTopBar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { MobileMailToolbar } from '@/components/layout/MobileMailToolbar';
import { EmailList } from '@/components/email/EmailList';
import { EmailDetail } from '@/components/email/EmailDetail';
import { ComposeSheet } from '@/components/compose/ComposeSheet';
import { SettingsSheet } from '@/components/settings/SettingsSheet';
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
    setSelectedEmail,
    compose,
    openComposeNew,
    closeCompose,
    emails,
    isSelectionMode,
    clearMailbox,
    clearSelection,
    setSelectionMode,
    setSearchQuery,
  } = useEmails();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileUnreadOnly, setMobileUnreadOnly] = useState(false);
  const lastActiveDomainId = useRef<string | null>(null);

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

    if (lastActiveDomainId.current === activeDomain.id) {
      await refreshEmails(activeDomain.id);
    }
  }, [activeDomain, refreshEmails]);

  useEffect(() => {
    if (!activeDomain) {
      if (lastActiveDomainId.current !== null) {
        lastActiveDomainId.current = null;
        clearMailbox();
      }
      return;
    }

    if (lastActiveDomainId.current !== activeDomain.id) {
      lastActiveDomainId.current = activeDomain.id;
      clearSelection();
      setSelectionMode(false);
      setSelectedEmail(null);
      setSearchQuery('');
      setMobileUnreadOnly(false);
    }

    loadEmails(activeDomain.id, currentView);
  }, [activeDomain, currentView, loadEmails, clearMailbox, clearSelection, setSelectionMode, setSelectedEmail, setSearchQuery]);

  const detailOpen = Boolean(selectedEmail);

  return (
    <div className="min-h-dvh bg-background text-ink">
      {/* ============ Mobile (< lg) ============ */}
      <div className="lg:hidden h-dvh flex flex-col">
        {!detailOpen && (
          <MobileTopBar
            onOpenDrawer={() => setDrawerOpen(true)}
            onSync={handleSync}
            unreadOnly={mobileUnreadOnly}
          />
        )}

        <main className="flex-1 min-h-0 overflow-y-auto">
          {!activeDomain ? (
            <EmptyState
              title="Welcome to BausMail"
              body="Configure RESEND_DOMAIN_API_KEYS on the server to start sending and receiving."
            />
          ) : detailOpen && selectedEmail ? (
            <EmailDetail email={selectedEmail} />
          ) : (
            <EmailList unreadOnly={mobileUnreadOnly} />
          )}
        </main>

        <MobileMailToolbar
          visible={!detailOpen && Boolean(activeDomain) && !isSelectionMode}
          unreadOnly={mobileUnreadOnly}
          unreadCount={emails.filter((email) => !email.isRead).length}
          onToggleUnread={() => setMobileUnreadOnly((value) => !value)}
          onCompose={openComposeNew}
        />

        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {/* ============ Desktop (≥ lg) ============ */}
      <div className="hidden lg:flex h-screen bg-background p-3 gap-3">
        <Sidebar
          activeView={currentView}
          onViewChange={setCurrentView}
          onCompose={openComposeNew}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0 rounded-2xl border border-line bg-surface overflow-hidden shadow-ios">
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
      />
    </div>
  );
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="text-lg font-semibold text-ink">{title}</div>
      <div className="text-sm text-ink-muted mt-2 max-w-xs">{body}</div>
    </div>
  );
}
