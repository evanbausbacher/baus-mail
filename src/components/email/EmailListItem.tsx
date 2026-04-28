'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Star, Trash2 } from 'lucide-react';
import type { Email } from '@/types/email';
import { useEmails } from '@/components/providers/EmailProvider';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatDate } from '@/lib/utils/date-helpers';
import { getEmailPreview, parseEmailAddress } from '@/lib/utils/email-helpers';
import { getInitials, avatarColor } from '@/lib/utils/avatar';
import { useEmailActions } from '@/hooks/useEmailActions';

interface EmailListItemProps {
  email: Email;
}

const SWIPE_THRESHOLD = 64;
const SWIPE_TRIGGER = 120;

export function EmailListItem({ email }: EmailListItemProps) {
  const { selectedEmails, toggleEmailSelection, selectedEmail, setSelectedEmail } = useEmails();
  const { toggleStar, trash, isActing } = useEmailActions();

  const isSelected = selectedEmails.has(email.id);
  const isActive = selectedEmail?.id === email.id;

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
  const [dx, setDx] = useState(0);
  const [committing, setCommitting] = useState(false);
  const draggingRef = useRef(false);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only respond to touch / pen swipes; mouse uses click only.
    if (e.pointerType === 'mouse') return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    draggingRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if (startX.current === null || startY.current === null) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    if (!draggingRef.current) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        draggingRef.current = true;
      } else {
        return;
      }
    }
    e.preventDefault();
    setDx(deltaX);
  };

  const finish = (commit: 'star' | 'trash' | null) => {
    if (!commit) {
      setDx(0);
      return;
    }
    setCommitting(true);
    // Snap to side, then run action
    const target = commit === 'trash' ? -window.innerWidth : window.innerWidth;
    setDx(target);
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      if (commit === 'star') toggleStar(email);
      else trash(email);
      setCommitting(false);
      setDx(0);
      commitTimerRef.current = null;
    }, 180);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    startX.current = null;
    startY.current = null;
    if (!wasDragging) {
      setDx(0);
      return;
    }
    if (dx <= -SWIPE_TRIGGER) finish('trash');
    else if (dx >= SWIPE_TRIGGER) finish('star');
    else setDx(0);
  };

  // Background visuals based on swipe direction
  const showStarBg = dx > SWIPE_THRESHOLD / 2;
  const showTrashBg = dx < -SWIPE_THRESHOLD / 2;

  return (
    <div className="relative bg-surface overflow-hidden">
      {/* Swipe action backgrounds */}
      <div
        className={clsx(
          'absolute inset-y-0 left-0 flex items-center pl-6 transition-opacity',
          'bg-yellow-400 text-white',
          showStarBg ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden
      >
        <Star className="w-5 h-5" fill="currentColor" />
      </div>
      <div
        className={clsx(
          'absolute inset-y-0 right-0 flex items-center pr-6 transition-opacity',
          'bg-red-500 text-white',
          showTrashBg ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden
      >
        <Trash2 className="w-5 h-5" />
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translate3d(${dx}px, 0, 0)`,
          transition: committing || dx === 0 ? 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
          touchAction: 'pan-y',
        }}
        className={clsx(
          'relative bg-surface border-b border-line cursor-pointer select-none',
          'min-h-[72px] px-3 py-3',
          isActive ? 'bg-line/30' : 'hover:bg-line/20'
        )}
        onClick={() => setSelectedEmail(email)}
      >
        <div className="flex items-start gap-3">
          {/* Desktop checkbox; hidden on mobile */}
          <div className="hidden lg:block pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onChange={() => toggleEmailSelection(email.id)}
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
                email.isRead ? 'text-ink-muted font-normal' : 'text-ink font-semibold'
              )}>
                {primaryLine}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!email.isRead && (
                  <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
                )}
                <span className="text-xs text-ink-subtle whitespace-nowrap">
                  {formatDate(email.createdAt)}
                </span>
              </div>
            </div>

            <div className={clsx(
              'truncate text-sm mt-0.5',
              email.isRead ? 'text-ink-muted' : 'text-ink font-medium'
            )}>
              {email.subject?.trim() ? email.subject : '(No subject)'}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xs text-ink-subtle truncate flex-1 min-w-0">{preview}</div>
              {email.isStarred && (
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
              toggleStar(email);
            }}
            disabled={isActing}
            aria-label={email.isStarred ? 'Unstar' : 'Star'}
          >
            <Star className="w-4 h-4 text-ink-muted" fill={email.isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}

