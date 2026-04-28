'use client';

import { RefreshCw, Trash2, AlertOctagon, Star, MailOpen, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import { useState } from 'react';
import { useEmailActions } from '@/hooks/useEmailActions';

interface TopBarProps {
  onSync: () => Promise<void>;
  onCompose: () => void;
}

export function TopBar({ onSync, onCompose }: TopBarProps) {
  const { selectedEmails, clearSelection, currentView, setSearchQuery, runSearch } = useEmails();
  const { activeDomain } = useDomains();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { act, isActing } = useEmailActions();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await onSync();
      setSyncMessage('Sync complete');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      setSyncMessage('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'star' | 'unstar' | 'spam' | 'notSpam' | 'markRead' | 'markUnread') => {
    if (selectedEmails.size === 0) return;
    await act(Array.from(selectedEmails), action, { clearSelection: true });
  };

  const viewTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);

  return (
    <div className="border-b border-line bg-surface">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-ink">{viewTitle}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleSync}
              disabled={isSyncing || !activeDomain}
              tooltip={isSyncing ? 'Syncing...' : 'Sync'}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="primary" onClick={onCompose}>
              Compose
            </Button>
          </div>
        </div>

        {syncMessage && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-background border border-line text-sm text-ink">
            {syncMessage}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search emails..."
              onSearch={async (query) => {
                setSearchQuery(query);
                if (activeDomain) {
                  await runSearch(activeDomain.id, currentView, query);
                }
              }}
            />
          </div>

          {selectedEmails.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-muted">
                {selectedEmails.size} selected
              </span>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('markRead')}
                disabled={isActing}
                tooltip="Mark as read"
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('markUnread')}
                disabled={isActing}
                tooltip="Mark as unread"
              >
                <MailOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('delete')}
                disabled={isActing}
                tooltip="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('star')}
                disabled={isActing}
                tooltip="Star"
              >
                <Star className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('unstar')}
                disabled={isActing}
                tooltip="Unstar"
              >
                <Star className="w-4 h-4 text-ink-subtle" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('spam')}
                disabled={isActing}
                tooltip="Mark as spam"
              >
                <AlertOctagon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={clearSelection}
                disabled={isActing}
                tooltip="Clear selection"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
