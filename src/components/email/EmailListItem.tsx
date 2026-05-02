'use client';

import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { Ellipsis, Mail, MailOpen, Reply, Star } from 'lucide-react';
import type { Email } from '@/types/email';
import { useEmails } from '@/components/providers/EmailProvider';
import { Checkbox } from '@/components/ui/Checkbox';
import { ActionSheet, ActionSheetButton } from '@/components/ui/ActionSheet';
import { formatDate } from '@/lib/utils/date-helpers';
import { getEmailPreview, parseEmailAddress } from '@/lib/utils/email-helpers';
import { getInitials, avatarColor } from '@/lib/utils/avatar';
import { useEmailActions } from '@/hooks/useEmailActions';

interface EmailListItemProps {
  email: Email;
  threadEmailIds?: string[];
  threadCount?: number;
  threadUnreadCount?: number;
  threadHasStarred?: boolean;
}

const SWIPE_THRESHOLD = 42;
const SWIPE_TRIGGER = 76;
const SWIPE_FULL_TRIGGER = 220;
const SWIPE_REVEAL = 240;
const READ_REVEAL = 88;

export function EmailListItem({
  email,
  threadEmailIds,
  threadCount = 1,
  threadUnreadCount,
  threadHasStarred,
}: EmailListItemProps) {
  const {
    selectedEmails,
    isSelectionMode,
    toggleEmailSelection,
    selectedEmail,
    setSelectedEmail,
    openComposeReply,
    openComposeReplyAll,
    openComposeForward,
  } = useEmails();
  const { act, isActing } = useEmailActions();

  const actionEmailIds = threadEmailIds?.length ? threadEmailIds : [email.id];
  const unreadCount = threadUnreadCount ?? (email.isRead ? 0 : 1);
  const hasStarred = threadHasStarred ?? email.isStarred;
  const isUnread = unreadCount > 0;
  const isSelected = actionEmailIds.length > 0 && actionEmailIds.every((id) => selectedEmails.has(id));
  const isActive = selectedEmail ? actionEmailIds.includes(selectedEmail.id) : false;
  const markAction = isUnread ? 'markRead' : 'markUnread';
  const markLabel = isUnread ? 'Read' : 'Unread';
  const starAction = hasStarred ? 'unstar' : 'star';

  const counterparty = email.type === 'sent'
    ? (email.to?.[0] ?? '')
    : email.from;

  const parsed = parseEmailAddress(counterparty);
  const displayName = parsed.name || parsed.address || (email.type === 'sent' ? '(no recipient)' : '(unknown)');
  const initials = getInitials(parsed.name || parsed.address);

  const primaryLine =
    email.type === 'sent'
      ? `To: ${displayName}`
      : displayName;

  const preview = getEmailPreview(email.text ?? null, email.html ?? null, 90);

  // ---- Swipe handling (touch / pointer) ----
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [openSide, setOpenSide] = useState<'left' | 'right' | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const draggingRef = useRef(false);
  const hasDraggedRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only respond to touch / pen swipes; mouse uses click only.
    if (e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = openSide === 'left' ? -SWIPE_REVEAL : openSide === 'right' ? READ_REVEAL : 0;
    draggingRef.current = false;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if (startX.current === null || startY.current === null) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    if (!draggingRef.current) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        draggingRef.current = true;
        hasDraggedRef.current = true;
      } else {
        return;
      }
    }
    e.preventDefault();
    const raw = startOffset.current + deltaX;
    const clamped = Math.max(-SWIPE_REVEAL - 28, Math.min(READ_REVEAL + 28, raw));
    setDx(clamped);
  };

  const closeSwipe = () => {
    setOpenSide(null);
    setDx(0);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    setIsDragging(false);
    startX.current = null;
    startY.current = null;
    if (!wasDragging) {
      return;
    }
    if (dx <= -SWIPE_FULL_TRIGGER) {
      closeSwipe();
      setMoreOpen(true);
    } else if (dx <= -SWIPE_TRIGGER) {
      setOpenSide('left');
      setDx(-SWIPE_REVEAL);
    } else if (dx >= SWIPE_TRIGGER) {
      setOpenSide('right');
      setDx(READ_REVEAL);
    } else {
      closeSwipe();
    }
  };

  // Background visuals based on swipe direction
  const showReadBg = dx > SWIPE_THRESHOLD / 2;
  const showLeftBg = dx < -SWIPE_THRESHOLD / 2;

  return (
    <div className="relative bg-surface overflow-hidden">
      {/* Swipe action backgrounds */}
      <div
        className={clsx(
          'absolute inset-y-0 left-0 flex items-center pl-6 transition-opacity',
          'bg-blue-500 text-white',
          showReadBg ? 'opacity-100' : 'opacity-0'
        )}
      >
        <button
          type="button"
          onClick={() => {
            act(actionEmailIds, markAction);
            closeSwipe();
          }}
          className="h-full w-[88px] pl-3 pr-4 flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          {isUnread ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
          {markLabel}
        </button>
      </div>
      <div
        className={clsx(
          'absolute inset-y-0 right-0 flex items-stretch justify-end transition-opacity',
          showLeftBg ? 'opacity-100' : 'opacity-0'
        )}
      >
        <button
          type="button"
          onClick={() => {
            setMoreOpen(true);
            closeSwipe();
          }}
          className="w-20 px-3 bg-slate-500 text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Ellipsis className="w-4 h-4" />More
        </button>
        <button
          type="button"
          onClick={() => {
            act(actionEmailIds, starAction);
            closeSwipe();
          }}
          className="w-20 px-3 bg-yellow-500 text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Star className="w-4 h-4" fill="currentColor" />Flag
        </button>
        <button
          type="button"
          onClick={() => {
            openComposeReply(email);
            closeSwipe();
          }}
          className="w-20 px-3 bg-blue-500 text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Reply className="w-4 h-4" />Reply
        </button>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translate3d(${dx}px, 0, 0)`,
          transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
          touchAction: 'pan-y',
        }}
        className={clsx(
          'relative bg-surface border-b border-line cursor-pointer select-none',
          'min-h-[72px] px-3 py-3',
          isActive ? 'bg-line/30' : 'hover:bg-line/20'
        )}
        onClick={() => {
          if (hasDraggedRef.current) return;
          if (openSide) {
            closeSwipe();
            return;
          }
          if (isSelectionMode) toggleEmailSelection(actionEmailIds);
          else setSelectedEmail(email);
        }}
      >
        <div className="flex items-start gap-3">
          <div className={clsx('pt-1', isSelectionMode ? 'block' : 'hidden lg:block')} onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onChange={() => toggleEmailSelection(actionEmailIds)}
              aria-label="Select email"
            />
          </div>

          {/* Avatar / initials */}
          <div
            className={clsx(
              'shrink-0 h-10 w-10 rounded-full inline-flex items-center justify-center text-sm font-semibold',
              avatarColor(parsed.address || displayName)
            )}
            aria-hidden
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className={clsx(
                'truncate text-[15px]',
                isUnread ? 'text-ink font-semibold' : 'text-ink-muted font-normal'
              )}>
                {primaryLine}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isUnread && (
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
                )}
                {threadCount > 1 && (
                  <span className="rounded-full bg-line/70 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
                    {threadCount}
                  </span>
                )}
                <span className="text-xs text-ink-subtle whitespace-nowrap">
                  {formatDate(email.createdAt)}
                </span>
              </div>
            </div>

            <div className={clsx(
              'truncate text-sm mt-0.5',
              isUnread ? 'text-ink font-medium' : 'text-ink-muted'
            )}>
              {email.subject?.trim() ? email.subject : '(No subject)'}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xs text-ink-subtle truncate flex-1 min-w-0">{preview}</div>
              {hasStarred && (
                <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" fill="currentColor" />
              )}
            </div>
          </div>

          {/* Desktop quick star */}
          <button
            type="button"
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-line/40"
            onClick={(e) => {
              e.stopPropagation();
              act(actionEmailIds, starAction);
            }}
            disabled={isActing}
            aria-label={hasStarred ? 'Unstar thread' : 'Star thread'}
          >
            <Star className="w-4 h-4 text-ink-muted" fill={hasStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <ActionSheet isOpen={moreOpen} title="Actions" onClose={() => setMoreOpen(false)}>
        <ActionSheetButton onClick={() => { openComposeReply(email); setMoreOpen(false); }}>Reply</ActionSheetButton>
        <ActionSheetButton onClick={() => { openComposeReplyAll(email); setMoreOpen(false); }}>Reply All</ActionSheetButton>
        <ActionSheetButton onClick={() => { openComposeForward(email); setMoreOpen(false); }}>Forward</ActionSheetButton>
        <ActionSheetButton onClick={() => { act(actionEmailIds, email.isArchived ? 'unarchive' : 'archive'); setMoreOpen(false); }}>Archive</ActionSheetButton>
        <ActionSheetButton onClick={() => { act(actionEmailIds, starAction); setMoreOpen(false); }}>{hasStarred ? 'Unflag' : 'Flag'}</ActionSheetButton>
        <ActionSheetButton onClick={() => { act(actionEmailIds, markAction); setMoreOpen(false); }}>
          {isUnread ? 'Mark as Read' : 'Mark as Unread'}
        </ActionSheetButton>
      </ActionSheet>
    </div>
  );
}
