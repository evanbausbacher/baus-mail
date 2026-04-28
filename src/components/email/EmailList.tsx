'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import { EmailListItem } from '@/components/email/EmailListItem';
import { Checkbox } from '@/components/ui/Checkbox';
import { ActionSheet, ActionSheetButton } from '@/components/ui/ActionSheet';
import { MovePicker } from '@/components/email/MovePicker';
import { EmailListSkeleton } from '@/components/email/EmailListSkeleton';
import { Loader2, Inbox } from 'lucide-react';
import { useEmailActions } from '@/hooks/useEmailActions';

const PULL_TRIGGER = 80;
const PULL_MAX = 120;

export function EmailList({ unreadOnly = false }: { unreadOnly?: boolean }) {
  const { activeDomain } = useDomains();
  const {
    emails,
    isLoading,
    error,
    selectedEmails,
    isSelectionMode,
    selectAllEmails,
    clearSelection,
    setSelectionMode,
    refreshEmails,
  } = useEmails();
  const { act } = useEmailActions();
  const [markOpen, setMarkOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const visibleEmails = useMemo(() => {
    return unreadOnly ? emails.filter((email) => !email.isRead) : emails;
  }, [emails, unreadOnly]);

  const visibleEmailIds = useMemo(() => {
    return visibleEmails.map((email) => email.id);
  }, [visibleEmails]);

  const allSelected = useMemo(() => {
    return visibleEmailIds.length > 0 && visibleEmailIds.every((id) => selectedEmails.has(id));
  }, [selectedEmails, visibleEmailIds]);

  const selectVisibleEmails = () => {
    selectAllEmails(visibleEmailIds);
  };

  // ---- Pull-to-refresh ----
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(false);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (refreshing) return;
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      if (!pulling) setPulling(true);
      setPullY(Math.min(dy * 0.5, PULL_MAX));
    }
  };
  const onTouchEnd = async () => {
    const wasPulling = pulling;
    setPulling(false);
    startY.current = null;
    if (!wasPulling) return;
    if (pullY >= PULL_TRIGGER) {
      setRefreshing(true);
      setPullY(60);
      try {
        await refreshEmails();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  if (!activeDomain) {
    return (
      <div className="p-6 text-sm text-ink-muted">
        Select a mailbox to view emails.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="min-h-full bg-surface relative"
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className="absolute left-0 right-0 top-0 flex items-center justify-center text-ink-muted z-20 pointer-events-none"
          style={{ height: pullY, transition: refreshing ? 'height 200ms ease-out' : 'none' }}
        >
          <Loader2
            className={`w-5 h-5 ${refreshing || pullY >= PULL_TRIGGER ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${Math.min((pullY / PULL_TRIGGER) * 180, 180)}deg)`,
            }}
          />
        </div>
      )}

      {/* Desktop-only "Select all" header */}
      <div className="hidden lg:flex sticky top-0 z-10 bg-surface border-b border-line px-4 py-3 items-center justify-between">
        <Checkbox
          checked={allSelected}
          onChange={(e) => {
            if (e.target.checked) selectVisibleEmails();
            else clearSelection();
          }}
          label="Select all"
        />
          <div className="text-xs text-ink-subtle">
          {visibleEmails.length} email{visibleEmails.length === 1 ? '' : 's'}
        </div>
      </div>

      {isSelectionMode && visibleEmails.length > 0 && (
        <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-2 backdrop-blur">
          <div className="text-sm font-medium text-ink">
            {selectedEmails.size} selected
          </div>
          <button
            type="button"
            onClick={allSelected ? clearSelection : selectVisibleEmails}
            className="h-9 px-3 text-sm font-semibold text-accent"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      <div
        style={{
          transform: `translate3d(0, ${pullY}px, 0)`,
          transition: pulling ? 'none' : 'transform 200ms ease-out',
        }}
      >
        {isLoading && emails.length === 0 ? (
          <EmailListSkeleton />
        ) : error ? (
          <div className="p-6 text-sm text-red-700">{error}</div>
        ) : visibleEmails.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-full bg-line/40 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-ink-muted" />
            </div>
            <div className="text-sm font-medium text-ink">{unreadOnly ? 'No unread emails' : 'No emails yet'}</div>
            <div className="text-xs text-ink-subtle mt-1">{unreadOnly ? 'Use the filter button to show all mail.' : 'Pull down to refresh.'}</div>
          </div>
        ) : (
          <div className="pb-2">
            {visibleEmails.map((email) => (
              <EmailListItem key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>

      {isSelectionMode && selectedEmails.size > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-safe">
          <div className="grid grid-cols-3 px-3 py-2">
            <button type="button" onClick={() => setMarkOpen(true)} className="h-11 text-accent font-medium">
              Mark
            </button>
            <button type="button" onClick={() => setMoveOpen(true)} className="h-11 text-accent font-medium">
              Move
            </button>
            <button
              type="button"
              onClick={() => act(Array.from(selectedEmails), 'delete', { clearSelection: true }).then(() => setSelectionMode(false))}
              className="h-11 text-red-600 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <ActionSheet isOpen={markOpen} title={`${selectedEmails.size} selected`} onClose={() => setMarkOpen(false)}>
        <ActionSheetButton onClick={() => act(Array.from(selectedEmails), 'markRead', { clearSelection: true }).then(() => setMarkOpen(false))}>
          Mark as Read
        </ActionSheetButton>
        <ActionSheetButton onClick={() => act(Array.from(selectedEmails), 'markUnread', { clearSelection: true }).then(() => setMarkOpen(false))}>
          Mark as Unread
        </ActionSheetButton>
        <ActionSheetButton onClick={() => act(Array.from(selectedEmails), 'spam', { clearSelection: true }).then(() => setMarkOpen(false))}>
          Move to Junk
        </ActionSheetButton>
        <ActionSheetButton onClick={() => act(Array.from(selectedEmails), 'star', { clearSelection: true }).then(() => setMarkOpen(false))}>
          Flag
        </ActionSheetButton>
        <ActionSheetButton onClick={() => act(Array.from(selectedEmails), 'unstar', { clearSelection: true }).then(() => setMarkOpen(false))}>
          Unflag
        </ActionSheetButton>
      </ActionSheet>

      <MovePicker
        isOpen={moveOpen}
        emailIds={Array.from(selectedEmails)}
        onClose={() => setMoveOpen(false)}
      />
    </div>
  );
}
