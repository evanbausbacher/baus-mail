'use client';

import { RefreshCw, Trash2, Archive, AlertOctagon, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import { useState } from 'react';

interface TopBarProps {
  onSync: () => Promise<void>;
  onCompose: () => void;
}

export function TopBar({ onSync, onCompose }: TopBarProps) {
  const { selectedEmails, clearSelection, currentView } = useEmails();
  const { activeDomain } = useDomains();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

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

  const handleBulkAction = async (action: 'delete' | 'star' | 'spam' | 'archive') => {
    if (selectedEmails.size === 0) return;

    // TODO: Implement bulk actions in Phase 7
    console.log(`Bulk ${action} for`, Array.from(selectedEmails));
    clearSelection();
  };

  const viewTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{viewTitle}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleSync}
              disabled={isSyncing || !activeDomain}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Button variant="primary" onClick={onCompose}>
              Compose
            </Button>
          </div>
        </div>

        {syncMessage && (
          <div className="mb-4 px-4 py-2 bg-gray-50 border border-gray-200 text-sm">
            {syncMessage}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search emails..."
              onSearch={(query) => {
                // TODO: Implement search in Phase 8
                console.log('Search:', query);
              }}
            />
          </div>

          {selectedEmails.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedEmails.size} selected
              </span>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('star')}
              >
                <Star className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('spam')}
              >
                <AlertOctagon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleBulkAction('archive')}
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={clearSelection}
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
