'use client';

import { Edit, ListFilter } from 'lucide-react';
import clsx from 'clsx';

interface MobileMailToolbarProps {
  unreadOnly: boolean;
  unreadCount: number;
  updatedLabel?: string;
  onToggleUnread: () => void;
  onCompose: () => void;
  visible?: boolean;
}

export function MobileMailToolbar({
  unreadOnly,
  unreadCount,
  updatedLabel = 'Updated Just Now',
  onToggleUnread,
  onCompose,
  visible = true,
}: MobileMailToolbarProps) {
  if (!visible) return null;

  return (
    <div className="lg:hidden shrink-0 border-t border-line bg-surface/95 backdrop-blur pb-safe">
      <div className="grid grid-cols-[64px_1fr_64px] items-center px-3 py-2 min-h-[64px]">
        <button
          type="button"
          onClick={onToggleUnread}
          aria-label={unreadOnly ? 'Show all emails' : 'Show unread emails'}
          className={clsx(
            'h-11 w-11 inline-flex items-center justify-center rounded-full justify-self-start',
            unreadOnly ? 'bg-accent text-white' : 'text-accent hover:bg-accent/10'
          )}
        >
          <ListFilter className="w-5 h-5" />
        </button>

        <div className="min-w-0 text-center">
          <div className="text-[13px] font-medium text-ink truncate">{updatedLabel}</div>
          <div className="text-xs text-ink-subtle">
            {unreadCount} Unread
          </div>
        </div>

        <button
          type="button"
          onClick={onCompose}
          aria-label="Compose new email"
          className="h-11 w-11 inline-flex items-center justify-center rounded-full justify-self-end text-accent hover:bg-accent/10"
        >
          <Edit className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
