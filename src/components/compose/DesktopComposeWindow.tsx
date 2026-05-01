'use client';

import { X } from 'lucide-react';
import type { ComposeDraft } from '@/lib/compose/draft';
import { ComposeForm } from './ComposeForm';

interface DesktopComposeWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initial: ComposeDraft;
}

function getComposeTitle(initial: ComposeDraft): string {
  if (initial.mode === 'reply') return 'Reply';
  if (initial.mode === 'replyAll') return 'Reply All';
  if (initial.mode === 'forward') return 'Forward';
  return 'New message';
}

export function DesktopComposeWindow({ isOpen, onClose, initial }: DesktopComposeWindowProps) {
  if (!isOpen) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-end p-6">
      <div className="pointer-events-auto flex h-[min(78vh,760px)] w-[min(100%,640px)] flex-col overflow-hidden rounded-t-2xl rounded-b-xl border border-line bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-line bg-canvas/60 px-5 py-3">
          <div className="text-sm font-semibold text-ink">{getComposeTitle(initial)}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-line/50 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ComposeForm initial={initial} mode="desktop" onClose={onClose} />
      </div>
    </div>
  );
}
