'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import { useFolders } from '@/hooks/useFolders';
import { SearchBar } from '@/components/ui/SearchBar';
import { DomainAvatar } from '@/components/domain/DomainAvatar';

interface MobileTopBarProps {
  onOpenDrawer: () => void;
  onSync: () => Promise<void>;
  unreadOnly?: boolean;
}

const VIEW_TITLE: Record<string, string> = {
  inbox: 'Inbox',
  sent: 'Sent',
  starred: 'Starred',
  spam: 'Spam',
  trash: 'Trash',
  archive: 'Archive',
};

export function MobileTopBar({ onOpenDrawer, onSync, unreadOnly = false }: MobileTopBarProps) {
  const { activeDomain } = useDomains();
  const { folders } = useFolders();
  const {
    currentView,
    selectedEmail,
    setSelectedEmail,
    isSelectionMode,
    setSelectionMode,
    searchQuery,
    setSearchQuery,
    runSearch,
  } = useEmails();
  const [searchOpen, setSearchOpen] = useState(false);
  const inDetail = Boolean(selectedEmail);
  const title = currentView.startsWith('folder:')
    ? folders.find((folder) => currentView === `folder:${folder.id}`)?.name ?? 'Folder'
    : VIEW_TITLE[currentView] ?? currentView;

  if (inDetail) {
    // Detail view's own header takes over; we render only the safe-area top.
    return <div className="pt-safe bg-surface" />;
  }

  void onSync;

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line pt-safe">
      <div className="flex items-center gap-2 px-3 pt-2 pb-1 min-h-12">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open mailboxes"
          className="h-10 inline-flex items-center rounded-full pr-2 text-accent hover:bg-accent/10"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-[20px] leading-none">Mailboxes</span>
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setSelectionMode(!isSelectionMode)}
          disabled={!activeDomain}
          className="h-10 px-5 inline-flex items-center justify-center rounded-full bg-line/50 text-accent text-[17px] font-semibold hover:bg-line disabled:opacity-40"
        >
          {isSelectionMode ? 'Done' : 'Select'}
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search"
          className={clsx(
            'h-10 w-10 inline-flex items-center justify-center rounded-full',
            searchOpen ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-line/40'
          )}
        >
          <SearchIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <h1 className="text-[38px] leading-[44px] font-bold tracking-normal text-ink truncate">
          {unreadOnly ? 'Unread' : title}
        </h1>
        {activeDomain && (
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-ink-subtle">
            <DomainAvatar domain={activeDomain} className="h-4 w-4 text-[8px]" />
            <span className="truncate">{activeDomain.name}</span>
          </div>
        )}
      </div>

      {searchOpen && (
        <div className="px-3 pb-3 -mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              if (searchQuery) {
                setSearchQuery('');
                if (activeDomain) runSearch(activeDomain.id, currentView, '');
              }
            }}
            aria-label="Close search"
            className="h-10 w-10 inline-flex items-center justify-center rounded-full text-ink hover:bg-line/40 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <SearchBar
              autoFocus
              initialValue={searchQuery}
              onSearch={async (q) => {
                setSearchQuery(q);
                if (activeDomain) await runSearch(activeDomain.id, currentView, q);
                if (selectedEmail) setSelectedEmail(null);
              }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
