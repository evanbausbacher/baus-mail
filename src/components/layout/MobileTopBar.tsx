'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Menu, Search as SearchIcon, RefreshCw, ArrowLeft } from 'lucide-react';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import { useFolders } from '@/hooks/useFolders';
import { SearchBar } from '@/components/ui/SearchBar';

interface MobileTopBarProps {
  onOpenDrawer: () => void;
  onSync: () => Promise<void>;
}

const VIEW_TITLE: Record<string, string> = {
  inbox: 'Inbox',
  sent: 'Sent',
  starred: 'Starred',
  spam: 'Spam',
  trash: 'Trash',
  archive: 'Archive',
};

export function MobileTopBar({ onOpenDrawer, onSync }: MobileTopBarProps) {
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
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const inDetail = Boolean(selectedEmail);
  const title = currentView.startsWith('folder:')
    ? folders.find((folder) => currentView === `folder:${folder.id}`)?.name ?? 'Folder'
    : VIEW_TITLE[currentView] ?? currentView;

  if (inDetail) {
    // Detail view's own header takes over; we render only the safe-area top.
    return <div className="pt-safe bg-surface" />;
  }

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line pt-safe">
      <div className="flex items-center gap-2 px-3 py-2 min-h-14">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open menu"
          className="h-10 w-10 inline-flex items-center justify-center rounded-full text-ink hover:bg-line/40"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-ink truncate leading-tight">
            {title}
          </div>
          {activeDomain && (
            <div className="text-[11px] text-ink-subtle truncate leading-tight">
              {activeDomain.name}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSelectionMode(!isSelectionMode)}
          disabled={!activeDomain}
          className="h-10 px-2 inline-flex items-center justify-center rounded-full text-accent text-sm font-medium hover:bg-accent/10 disabled:opacity-40"
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

        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing || !activeDomain}
          aria-label="Sync"
          className="h-10 w-10 inline-flex items-center justify-center rounded-full text-ink hover:bg-line/40 disabled:opacity-40"
        >
          <RefreshCw className={clsx('w-5 h-5', isSyncing && 'animate-spin')} />
        </button>
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
